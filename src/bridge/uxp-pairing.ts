import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

// SEC 10 (fork): zero-configuration pairing between the MCP server and the
// UXP panel. After the UXP bridge binds a loopback port, the server writes a
// pairing file (bridge URL + token) into every well-known UXP plugin data
// location it can find, plus the bridge temp dir. The panel reads the file
// from its own data folder on startup and connects by itself — end users
// never paste secrets or URLs by hand. Manual entry keeps working and stays
// the fallback. PREMIERE_MCP_SEC_AUTO_PAIRING=0 disables the writer.

const PAIRING_FILENAME = "uxp-pairing.json";
const UXP_PLUGIN_ID = "com.ppmcp.premiere.uxp";
const BRIDGE_TEMP_SUBDIR = "premiere-mcp-bridge";

export interface UxpPairingInfo {
  url: string;
  token: string;
  serverVersion?: string;
  /** This server's boot time (Date.now()); arbitration yields to newer servers. */
  startedAt?: number;
}

interface PairingDocument extends UxpPairingInfo {
  schema: "premiere-mcp.uxp-pairing.v1";
  pid: number;
  issuedAt: number;
  /** How often the live server rewrites the file; 3x without a refresh = stale. */
  heartbeatMs: number;
}

function appDataBase(): string {
  if (process.env.APPDATA && process.env.APPDATA.trim() !== "") return process.env.APPDATA;
  return join(homedir(), process.platform === "win32" ? join("AppData", "Roaming") : join("Library", "Application Support"));
}

function pluginStorageRoot(): string {
  return join(appDataBase(), "Adobe", "UXP", "PluginsStorage", "PPRO");
}

/**
 * Every directory the pairing file should be written to: the plugin data
 * folders of every Premiere major version installed on the machine (External
 * and Internal layouts, plus their PluginData subfolders when present), and
 * the bridge temp dir as the documented fallback the panel also probes.
 */
export function pairingDirectories(explicitTempDir?: string): string[] {
  const candidates = new Set<string>();
  const storageRoot = pluginStorageRoot();
  try {
    for (const hostMajor of readdirSync(storageRoot)) {
      const hostDir = join(storageRoot, hostMajor);
      if (!statSync(hostDir).isDirectory()) continue;
      for (const layout of ["External", "Internal"]) {
        const pluginDir = join(hostDir, layout, UXP_PLUGIN_ID);
        if (!existsSync(pluginDir) || !statSync(pluginDir).isDirectory()) continue;
        candidates.add(pluginDir);
        const pluginData = join(pluginDir, "PluginData");
        if (existsSync(pluginData) && statSync(pluginData).isDirectory()) candidates.add(pluginData);
      }
    }
  } catch {
    // no UXP storage on this machine (or unreadable): the temp-dir fallback below still applies
  }
  candidates.add(explicitTempDir ?? join(tmpdir(), BRIDGE_TEMP_SUBDIR));
  return [...candidates];
}

function renderPairingDocument(info: UxpPairingInfo): string {
  const document: PairingDocument = {
    schema: "premiere-mcp.uxp-pairing.v1",
    url: info.url,
    token: info.token,
    pid: process.pid,
    issuedAt: Date.now(),
    heartbeatMs: PAIRING_HEARTBEAT_MS,
    ...(info.startedAt != null ? { startedAt: info.startedAt } : {}),
    ...(info.serverVersion ? { serverVersion: info.serverVersion } : {}),
  };
  return JSON.stringify(document);
}

/** How often the live server refreshes the pairing file (panel staleness window = 3x). */
export const PAIRING_HEARTBEAT_MS = 5000;

interface ExistingClaim {
  pid?: unknown;
  issuedAt?: unknown;
  startedAt?: unknown;
}

function readExistingClaim(file: string): ExistingClaim | null {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as ExistingClaim;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export interface PairingClaimResult {
  /** false = a newer live server owns the pairing; this server must yield. */
  claimed: boolean;
  winnerPid?: number;
}

/**
 * SEC 10 (fork): claim the pairing with deterministic arbitration.
 *
 * A pure last-writer-wins heartbeat breaks with two LIVE servers: each keeps
 * rewriting the file every few seconds and the panel flaps or stays with the
 * old one indefinitely (R10 hold-server anti-pattern). The claim check makes
 * ownership deterministic — the server with the NEWER startedAt owns the
 * pairing; an older server yields (stops writing) but keeps its listener, and
 * its next heartbeat automatically re-claims if the winner's file goes stale
 * (winner died). Ties break by larger pid. No process is ever killed: the
 * yielding server only stops competing for the file.
 */
export function claimPairing(info: UxpPairingInfo, explicitTempDir?: string): PairingClaimResult {
  const canonical = pairingDirectories(explicitTempDir).at(-1);
  if (canonical) {
    const existing = readExistingClaim(join(canonical, PAIRING_FILENAME));
    const otherPid = typeof existing?.pid === "number" ? existing.pid : null;
    if (otherPid !== null && otherPid !== process.pid) {
      const otherLive = typeof existing?.issuedAt === "number" && Date.now() - existing.issuedAt <= PAIRING_HEARTBEAT_MS * 3;
      const otherStartedAt = typeof existing?.startedAt === "number" ? existing.startedAt : null;
      const myStartedAt = info.startedAt ?? 0;
      const otherIsNewer = otherStartedAt != null
        ? otherStartedAt > myStartedAt || (otherStartedAt === myStartedAt && otherPid > process.pid)
        : false;
      if (otherLive && otherIsNewer) {
        return { claimed: false, winnerPid: otherPid };
      }
    }
  }
  writePairingFiles(info, explicitTempDir);
  return { claimed: true };
}

/** Writes the pairing file to every candidate directory. Returns the written paths. */
export function writePairingFiles(info: UxpPairingInfo, explicitTempDir?: string): string[] {
  const written: string[] = [];
  const payload = renderPairingDocument(info);
  for (const dir of pairingDirectories(explicitTempDir)) {
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, PAIRING_FILENAME), payload, { encoding: "utf8" });
      written.push(join(dir, PAIRING_FILENAME));
    } catch {
      // an unwritable candidate is not fatal; the panel falls back to manual entry
    }
  }
  return written;
}

function readPairingPid(file: string): number | null {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { pid?: unknown };
    return typeof parsed.pid === "number" ? parsed.pid : null;
  } catch {
    return null;
  }
}

/**
 * Removes this server's pairing files on shutdown. A file written by another
 * (live) process is left alone, so a second server keeps its pairing intact.
 */
export function deleteOwnPairingFiles(explicitTempDir?: string): void {
  for (const dir of pairingDirectories(explicitTempDir)) {
    const file = join(dir, PAIRING_FILENAME);
    if (!existsSync(file)) continue;
    const pid = readPairingPid(file);
    if (pid === process.pid) {
      try { unlinkSync(file); } catch { /* best-effort cleanup */ }
    }
  }
}

/** The canonical pairing file name, shared with the panel reader. */
export function pairingFileName(): string {
  return PAIRING_FILENAME;
}
