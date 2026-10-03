#!/usr/bin/env node
// SEC qa (R8): mechanical library-effect sweep driver.
// For every video matchName in the panel's own catalog: add → touch the first
// scalar param (dramatic value parsed from the host's own range error) →
// capture the live renderer → PSNR vs baseline → remove (fresh inspect before
// every removal so shifting indices can never pile up effects, the R7 hazard).
//
// Uso:
//   node r8-effect-sweep.js [--max N] [--out DIR] [--audio] [--preset EPR]
// Requiere: Premiere abierto con stress4, CEP bridge Running, panel UXP conectado.
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : dflt; };
const has = (name) => args.includes("--" + name);
const OUT = path.resolve(opt("out", "C:/Users/rpach/Videos/stress4/runs/r8-sweep"));
const MAX = parseInt(opt("max", "0"), 10) || Infinity;
const AUDIO = has("audio");
const PRESET = opt("preset", "");
fs.mkdirSync(OUT, { recursive: true });

const env = { ...process.env };
env.PREMIERE_TEMP_DIR = env.PREMIERE_TEMP_DIR || "C:\\Users\\rpach\\AppData\\Local\\PremiereMCPBridge";
env.PREMIERE_MCP_CAPABILITIES = env.PREMIERE_MCP_CAPABILITIES || "inspect,edit,export,filesystem";
env.PREMIERE_MCP_TOOL_PACKS = env.PREMIERE_MCP_TOOL_PACKS || "full";
env.PREMIERE_TIMEOUT_MS = env.PREMIERE_TIMEOUT_MS || "120000";
if (!env.PREMIERE_UXP_TOKEN) env.PREMIERE_UXP_TOKEN = fs.readFileSync("C:/Users/rpach/AppData/Local/Temp/uxp-token.txt", "utf8").trim();

const child = spawn("premiere-pro-mcp.cmd", [], { shell: true, env, cwd: __dirname });
function killTree() { if (child.pid && !child.killed) { try { spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", timeout: 10000 }); } catch (_) {} } }
process.on("exit", killTree);

let buf = ""; const pending = new Map(); let nextId = 1000;
child.stdout.on("data", (d) => {
  buf += d; let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); p.resolve(msg); }
  }
});
function call(method, params, timeoutMs = 90000) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error("timeout " + method)); } }, timeoutMs);
  });
}
async function tool(name, toolArgs, timeoutMs = 90000) {
  const res = await call("tools/call", { name, arguments: toolArgs || {} }, timeoutMs);
  const text = (res.result?.content ?? []).map((c) => c.text ?? "").join("\n");
  const structured = res.result?.structuredContent;
  return { isError: !!res.result?.isError, text, structured, raw: JSON.stringify(res.result ?? {}) };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function psnrDb(a, b) {
  const r = spawnSync("ffmpeg", ["-y", "-i", a, "-i", b, "-filter_complex", "psnr", "-f", "null", "-"], { timeout: 60000 });
  const m = String(r.stderr).match(/average:([0-9.]+|inf)/);
  if (!m) return null;
  return m[1] === "inf" ? Infinity : parseFloat(m[1]);
}
function findPath(raw) {
  const m = raw.match(/[A-Z]:\\[^"]+\.(png|jpg|jpeg)/i);
  return m ? m[0] : null;
}
function extractResult(t) { try { return JSON.parse(t).result ?? JSON.parse(t); } catch { return {}; } }


function saveInlineImage(raw, outDir, tag) {
  try {
    const parsed = JSON.parse(raw);
    const content = (parsed.content || []);
    for (const item of content) {
      if (item.type === 'image' && item.data) {
        const p = outDir + '/r8-capture-' + tag + '.png';
        fs.writeFileSync(p, Buffer.from(item.data, 'base64'));
        return p;
      }
    }
  } catch (_) {}
  return null;
}

const BUILTIN = new Set(["AE.ADBE Motion", "AE.ADBE Opacity", "AE.ADBE Vector Motion", "AE.ADBE Time Remapping", "AE.ADBE Graphic Group", "AE.ADBE Text", "AE.ADBE Shape"]);

async function waitBridge() {
  for (let i = 0; i < 60; i++) {
    try { const s = await tool("get_uxp_state", {}, 20000); if (!s.isError) return true; } catch (_) {}
    await sleep(5000);
  }
  return false;
}

async function videoSweep() {
  await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "r8-sweep", version: "1" } });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  if (!await waitBridge()) throw new Error("UXP bridge not connected");
  console.log("[r8] puente UXP conectado");

  // canonical clip at V1/clip0, playhead mid-clip, baseline frame
  await tool("manage_sequence_playhead_uxp", { action: "set", position_seconds: 4 });
  const base = await tool("capture_frame", { time_seconds: 4 });
  if (base.isError) throw new Error("capture_frame baseline: " + base.text.slice(0, 200));
  const baselinePath = findPath(base.raw) || saveInlineImage(base.raw, OUT, "baseline");
  if (!baselinePath) throw new Error("no pude extraer el path del baseline. RAW: " + base.raw.slice(0, 500));
  console.log("[r8] baseline:", baselinePath);

  const cat = await tool("manage_clip_effects_uxp", { action: "catalog", media_type: "video" });
  const catalogResult = extractResult(cat.text);
  const entries = [];
  const catalogRoot = catalogResult.video || catalogResult;
  const mns = catalogRoot.matchNames || [];
  const dns = catalogRoot.displayNames || [];
  mns.forEach((m, i) => entries.push({ matchName: m, displayName: dns[i] || m }));
  const effects = [...new Set(entries.map((e) => e.matchName))].filter((n) => !BUILTIN.has(n)).sort();
  const rows = [];
  const list = effects.slice(0, MAX);
  for (let i = 0; i < list.length; i++) {
    const eff = list[i];
    const row = { matchName: eff, added: false, param: null, psnrDb: null, removed: null, notes: [] };
    try {
      const add = await tool("manage_clip_effects_uxp", { action: "add", media_type: "video", track_index: 0, clip_index: 0, effect_id: eff, expected_effect_id: eff });
      if (add.isError) { row.notes.push("add: " + add.text.slice(0, 140)); rows.push(row); console.log(`[${i + 1}/${list.length}] ${eff} → ADD FALLÓ`); continue; }
      row.added = true;

      // fresh inspect: find this component's index and probe its params
      const insp = await tool("manage_clip_effects_uxp", { action: "inspect", media_type: "video", track_index: 0, clip_index: 0 });
      const inspResult = extractResult(insp.text);
      let comps = [];
      const findComps = (node) => { if (!node || typeof node !== "object") return; if (Array.isArray(node.components)) comps = node.components; for (const v of Object.values(node)) if (v && typeof v === "object") findComps(v); };
      findComps(inspResult);
      const mine = comps.find((c) => (c.matchName || c.id) === eff);
      const compIndex = mine ? comps.indexOf(mine) : -1;
      row.componentIndex = compIndex;

      if (compIndex >= 0) {
        for (let p = 0; p < 24; p++) {
          const pi = await tool("automate_effect_parameters_uxp", { action: "inspect", media_type: "video", track_index: 0, clip_index: 0, component_index: compIndex, param_index: p });
          if (pi.isError) continue;
          const pr = extractResult(pi.text);
          const val = pr && typeof pr.value !== "undefined" ? pr.value : undefined;
          if (typeof val === "number") {
            let target = 100;
            const set1 = await tool("automate_effect_parameters_uxp", { action: "set_value", media_type: "video", track_index: 0, clip_index: 0, component_index: compIndex, param_index: p, value: target });
            if (set1.isError) {
              const m = set1.text.match(/must be from (-?[\d.]+) to (-?[\d.]+)/);
              if (m) { target = parseFloat(m[2]); const set2 = await tool("automate_effect_parameters_uxp", { action: "set_value", media_type: "video", track_index: 0, clip_index: 0, component_index: compIndex, param_index: p, value: target }); if (set2.isError) { row.notes.push("set: " + set2.text.slice(0, 120)); continue; } }
              else { row.notes.push("set: " + set1.text.slice(0, 120)); continue; }
            }
            row.param = { index: p, name: pr.paramName, value: target };
            break;
          }
        }
      }

      await sleep(2500); // deja respirar al renderer
      const cap = await tool("capture_frame", { time_seconds: 4 + (i % 50) * 0.002 });
      const capPath = findPath(cap.raw) || saveInlineImage(cap.raw, OUT, "cap");
      if (capPath) row.psnrDb = psnrDb(baselinePath, capPath); else row.notes.push("captura sin path");

      const rm = await tool("manage_clip_effects_uxp", { action: "remove", media_type: "video", track_index: 0, clip_index: 0, effect_id: eff, expected_effect_id: eff, component_index: compIndex });
      row.removed = !rm.isError;
      if (rm.isError) row.notes.push("remove: " + rm.text.slice(0, 140));
    } catch (e) {
      row.notes.push("excepción: " + String(e.message).slice(0, 140));
    }
    rows.push(row);
    const verdict = row.psnrDb == null ? "s/dato" : (row.psnrDb === Infinity ? "NO-OP" : `PSNR ${row.psnrDb.toFixed(1)} dB`);
    console.log(`[${i + 1}/${list.length}] ${eff} → ${verdict}${row.removed === false ? " (SIN REMOVER)" : ""}`);
    if (i % 10 === 9) fs.writeFileSync(path.join(OUT, "results-partial.json"), JSON.stringify(rows, null, 1));
  }

  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(rows, null, 1));
  const rendered = rows.filter((r) => r.psnrDb != null && r.psnrDb !== Infinity && r.psnrDb < 40).length;
  const noop = rows.filter((r) => r.psnrDb === Infinity).length;
  const md = ["| matchName | PSNR dB | param tocado | removido | notas |", "|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.matchName} | ${r.psnrDb == null ? "s/dato" : r.psnrDb === Infinity ? "∞ (no-op)" : r.psnrDb.toFixed(2)} | ${r.param ? `#${r.param.index} ${r.param.name}=${r.param.value}` : "—"} | ${r.removed} | ${r.notes.join("; ").slice(0, 120)} |`)];
  md.push("", `**Renderizan (PSNR<40): ${rendered}/${rows.length} · no-op (∞): ${noop}**`);
  fs.writeFileSync(path.join(OUT, "results.md"), md.join("\n"));
  console.log(`[r8] FIN — renderizan ${rendered}, no-op ${noop}, total ${rows.length}. Resultados en ${OUT}`);
}

async function audioSweep() {
  await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "r8-sweep-audio", version: "1" } });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  if (!await waitBridge()) throw new Error("UXP bridge not connected");
  if (!PRESET) throw new Error("--preset EPR requerido en modo --audio (render por efecto)");
  const cat = await tool("manage_clip_effects_uxp", { action: "catalog", media_type: "audio" });
  const catalogResult = extractResult(cat.text);
  const names = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if ((k === "displayName" || k === "matchName") && typeof v === "string") names.push(v);
      else if (v && typeof v === "object") walk(v);
    }
  };
  walk(catalogResult);
  const effects = [...new Set(names.concat((catalogResult.audio && catalogResult.audio.displayNames) || []))].sort();
  console.log(`[r8-audio] catálogo audio: ${effects.length} entradas`);
  const rows = [];
  const list = effects.slice(0, MAX);
  for (let i = 0; i < list.length; i++) {
    const eff = list[i];
    const row = { effect: eff, added: false, param: null, maxVolumeDb: null, removed: null, notes: [] };
    try {
      const add = await tool("manage_clip_effects_uxp", { action: "add", media_type: "audio", track_index: 0, clip_index: 0, effect_id: eff, expected_effect_id: eff });
      if (add.isError) { row.notes.push("add: " + add.text.slice(0, 120)); rows.push(row); continue; }
      row.added = true;
      const insp = await tool("manage_clip_effects_uxp", { action: "inspect", media_type: "audio", track_index: 0, clip_index: 0 });
      const inspResult = extractResult(insp.text);
      let comps = []; const findC = (n) => { if (!n || typeof n !== "object") return; if (Array.isArray(n.components)) comps = n.components; for (const v of Object.values(n)) if (v && typeof v === "object") findC(v); };
      findC(inspResult);
      const mine = comps.find((c) => (c.matchName || c.displayName || c.id) === eff);
      const idx = mine ? comps.indexOf(mine) : -1;
      if (idx >= 0) {
        for (let p = 0; p < 8; p++) {
          const pi = await tool("automate_effect_parameters_uxp", { action: "inspect", media_type: "audio", track_index: 0, clip_index: 0, component_index: idx, param_index: p });
          if (pi.isError) break;
          const pr = extractResult(pi.text);
          if (typeof pr.value === "number") {
            let target = 100;
            const s1 = await tool("automate_effect_parameters_uxp", { action: "set_value", media_type: "audio", track_index: 0, clip_index: 0, component_index: idx, param_index: p, value: target });
            if (s1.isError) {
              const m = s1.text.match(/must be from (-?[\d.]+) to (-?[\d.]+)/);
              if (m) { target = parseFloat(m[2]); const s2 = await tool("automate_effect_parameters_uxp", { action: "set_value", media_type: "audio", track_index: 0, clip_index: 0, component_index: idx, param_index: p, value: target }); if (s2.isError) { row.notes.push("set: " + s2.text.slice(0, 100)); continue; } }
              else { row.notes.push("set: " + s1.text.slice(0, 100)); continue; }
            }
            row.param = { index: p, name: pr.paramName, value: target };
            break;
          }
        }
      }
      const out = path.join(OUT, "audio-" + String(i).padStart(3, "0") + ".mp4");
      const render = await tool("add_to_render_queue", { output_path: out, preset_path: PRESET }, 180000);
      if (render.isError) { row.notes.push("render: " + render.text.slice(0, 120)); }
      else {
        for (let w = 0; w < 24; w++) { await sleep(5000); if (fs.existsSync(out) && fs.statSync(out).size > 10000) break; }
        await sleep(3000);
        const v = spawnSync("ffmpeg", ["-i", out, "-af", "volumedetect", "-f", "null", "-"], { timeout: 120000 });
        const m = String(v.stderr).match(/max_volume: (-?[\d.]+) dB/);
        row.maxVolumeDb = m ? parseFloat(m[1]) : null;
      }
      const rm = await tool("manage_clip_effects_uxp", { action: "remove", media_type: "audio", track_index: 0, clip_index: 0, effect_id: eff, expected_effect_id: eff, component_index: idx });
      row.removed = !rm.isError;
    } catch (e) { row.notes.push("excepción: " + String(e.message).slice(0, 120)); }
    rows.push(row);
    console.log(`[${i + 1}/${list.length}] ${eff} → max ${row.maxVolumeDb} dB${row.removed === false ? " (SIN REMOVER)" : ""}`);
    fs.writeFileSync(path.join(OUT, "audio-results.json"), JSON.stringify(rows, null, 1));
  }
  fs.writeFileSync(path.join(OUT, "audio-results.json"), JSON.stringify(rows, null, 1));
  console.log(`[r8-audio] FIN — ${rows.length} efectos; resultados en ${OUT}`);
}

(async () => {
  try { await (AUDIO ? audioSweep() : videoSweep()); }
  catch (e) { console.error("[r8] FATAL:", e.message); process.exitCode = 1; }
  finally { killTree(); process.exit(process.exitCode || 0); }
})();
