import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  deleteOwnPairingFiles,
  pairingDirectories,
  pairingFileName,
  writePairingFiles,
} from "../src/bridge/uxp-pairing.js";

const ORIGINAL_APPDATA = process.env.APPDATA;
const tempFixtures: string[] = [];

function makeStorageFixture(hostMajor: string, layout: "External" | "Internal"): string {
  const root = mkdtempSync(join(tmpdir(), "uxp-pairing-test-"));
  tempFixtures.push(root);
  mkdirSync(join(root, "Adobe", "UXP", "PluginsStorage", "PPRO", hostMajor, layout, "com.ppmcp.premiere.uxp"), { recursive: true });
  return root;
}

function makeTempFallback(): string {
  const root = mkdtempSync(join(tmpdir(), "uxp-pairing-temp-"));
  tempFixtures.push(root);
  return join(root, "premiere-mcp-bridge");
}

afterEach(() => {
  for (const fallback of tempFixtures) deleteOwnPairingFiles(fallback);
  tempFixtures.length = 0;
  process.env.APPDATA = ORIGINAL_APPDATA;
});

describe("SEC 10: UXP pairing files", () => {
  it("discovers installed plugin data folders (External and Internal, any host major)", () => {
    process.env.APPDATA = makeStorageFixture("26", "External");
    expect(pairingDirectories().some((d) => d.includes(join("26", "External", "com.ppmcp.premiere.uxp")))).toBe(true);

    process.env.APPDATA = makeStorageFixture("25", "Internal");
    expect(pairingDirectories().some((d) => d.includes(join("25", "Internal", "com.ppmcp.premiere.uxp")))).toBe(true);
  });

  it("always includes the bridge temp fallback and creates it on write", () => {
    const fallback = makeTempFallback();
    expect(pairingDirectories(fallback)).toContain(fallback);
    const written = writePairingFiles({ url: "ws://127.0.0.1:12345/uxp", token: "t".repeat(16) }, fallback);
    expect(written).toContain(join(fallback, pairingFileName()));
    const stored = JSON.parse(readFileSync(join(fallback, pairingFileName()), "utf8"));
    expect(stored).toMatchObject({
      schema: "premiere-mcp.uxp-pairing.v1",
      url: "ws://127.0.0.1:12345/uxp",
      token: "t".repeat(16),
      pid: process.pid,
      heartbeatMs: 5000,
    });
    expect(typeof stored.issuedAt).toBe("number");
  });

  it("refreshes issuedAt on every write so the panel can detect liveness", async () => {
    const fallback = makeTempFallback();
    const first = JSON.parse(readFileSync(writePairingFiles({ url: "ws://127.0.0.1:1/uxp", token: "a".repeat(16) }, fallback)[0], "utf8"));
    await new Promise((r) => setTimeout(r, 15));
    const second = JSON.parse(readFileSync(writePairingFiles({ url: "ws://127.0.0.1:1/uxp", token: "a".repeat(16) }, fallback)[0], "utf8"));
    expect(second.issuedAt).toBeGreaterThanOrEqual(first.issuedAt);
  });

  it("writes into discovered plugin folders as well as the temp fallback", () => {
    const root = makeStorageFixture("26", "External");
    process.env.APPDATA = root;
    const pluginDir = join(root, "Adobe", "UXP", "PluginsStorage", "PPRO", "26", "External", "com.ppmcp.premiere.uxp");
    const written = writePairingFiles({ url: "ws://127.0.0.1:9/uxp", token: "u".repeat(16) }, makeTempFallback());
    expect(written.some((p) => p.startsWith(pluginDir))).toBe(true);
    expect(written.length).toBeGreaterThanOrEqual(2);
  });

  it("deleteOwnPairingFiles removes only files carrying this process's pid", () => {
    const fallback = makeTempFallback();
    writePairingFiles({ url: "ws://127.0.0.1:1/uxp", token: "a".repeat(16) }, fallback);
    const file = join(fallback, pairingFileName());
    expect(existsSync(file)).toBe(true);

    // a foreign live server overwrites the file after us
    writeFileSync(file, JSON.stringify({ schema: "premiere-mcp.uxp-pairing.v1", url: "x", token: "y", pid: process.pid + 424242, issuedAt: 1 }));
    deleteOwnPairingFiles(fallback);
    expect(existsSync(file)).toBe(true);

    writeFileSync(file, JSON.stringify({ schema: "premiere-mcp.uxp-pairing.v1", url: "x", token: "y", pid: process.pid, issuedAt: 1 }));
    deleteOwnPairingFiles(fallback);
    expect(existsSync(file)).toBe(false);
  });
});

import { claimPairing } from "../src/bridge/uxp-pairing.js";

describe("SEC 10: pairing ownership arbitration (R10)", () => {
  const ORIGINAL_APPDATA_ARBITRATION = process.env.APPDATA;

  function isolatedAppData(): string {
    const root = mkdtempSync(join(tmpdir(), "uxp-arbitration-"));
    tempFixtures.push(root);
    process.env.APPDATA = root; // aislar: NADA de los pares reales de la máquina
    return root;
  }

  afterEach(() => {
    process.env.APPDATA = ORIGINAL_APPDATA_ARBITRATION;
  });

  it("yields to a NEWER live claim from a different pid without touching its file", () => {
    const fallback = makeTempFallback();
    mkdirSync(fallback, { recursive: true });
    isolatedAppData();
    const winner = { schema: "premiere-mcp.uxp-pairing.v1" as const, url: "ws://127.0.0.1:2/uxp", token: "w".repeat(16), pid: process.pid + 777, issuedAt: Date.now(), startedAt: Date.now() + 5000, heartbeatMs: 5000 };
    writeFileSync(join(fallback, pairingFileName()), JSON.stringify(winner));
    const result = claimPairing({ url: "ws://127.0.0.1:1/uxp", token: "a".repeat(16), startedAt: Date.now() }, fallback);
    expect(result.claimed).toBe(false);
    expect(result.winnerPid).toBe(winner.pid);
    expect(JSON.parse(readFileSync(join(fallback, pairingFileName()), "utf8")).pid).toBe(winner.pid);
  });

  it("takes over when the newer claim is STALE (winner died)", () => {
    const fallback = makeTempFallback();
    mkdirSync(fallback, { recursive: true });
    isolatedAppData();
    const dead = { schema: "premiere-mcp.uxp-pairing.v1" as const, url: "ws://127.0.0.1:2/uxp", token: "w".repeat(16), pid: process.pid + 778, issuedAt: Date.now() - 60000, startedAt: Date.now() + 5000, heartbeatMs: 5000 };
    writeFileSync(join(fallback, pairingFileName()), JSON.stringify(dead));
    const result = claimPairing({ url: "ws://127.0.0.1:1/uxp", token: "a".repeat(16), startedAt: Date.now() }, fallback);
    expect(result.claimed).toBe(true);
    expect(JSON.parse(readFileSync(join(fallback, pairingFileName()), "utf8")).pid).toBe(process.pid);
  });

  it("takes over when the existing claim is older (self is the newest server)", () => {
    const fallback = makeTempFallback();
    mkdirSync(fallback, { recursive: true });
    isolatedAppData();
    const older = { schema: "premiere-mcp.uxp-pairing.v1" as const, url: "ws://127.0.0.1:2/uxp", token: "w".repeat(16), pid: process.pid + 779, issuedAt: Date.now(), startedAt: Date.now() - 60000, heartbeatMs: 5000 };
    writeFileSync(join(fallback, pairingFileName()), JSON.stringify(older));
    const result = claimPairing({ url: "ws://127.0.0.1:1/uxp", token: "a".repeat(16), startedAt: Date.now() }, fallback);
    expect(result.claimed).toBe(true);
    expect(JSON.parse(readFileSync(join(fallback, pairingFileName()), "utf8")).pid).toBe(process.pid);
  });

  it("writes startedAt into the document for arbitration", () => {
    const fallback = makeTempFallback();
    isolatedAppData();
    writePairingFiles({ url: "ws://127.0.0.1:3/uxp", token: "b".repeat(16), startedAt: 123456 }, fallback);
    expect(JSON.parse(readFileSync(join(fallback, pairingFileName()), "utf8")).startedAt).toBe(123456);
  });
});
