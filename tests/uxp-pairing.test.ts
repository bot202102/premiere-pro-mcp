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
    });
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
