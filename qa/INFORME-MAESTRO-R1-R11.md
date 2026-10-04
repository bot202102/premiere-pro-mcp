# INFORME MAESTRO — QA del server MCP de Premiere Pro (Rondas 1–11)

> Fecha de cierre: 2026-10-04 · Fork probado: `bot202102`, builds `sec/1.18.6-x` → `sec/1.19.0-6`
> Host: Premiere Pro 2026 26.5.2 (es-ES, Windows) · Proyectos desechables solamente
> **Los 11 reportes están consolidados (copias idénticas) en `C:\Users\rpach\Videos\stress4\informe-consolidado\`**
> — el original de cada ronda quedó en su carpeta de trabajo (ver índice abajo).

## 1. Índice de rondas y rutas reales

| Ronda | Reporte original (ruta real) | Copia | Build probado | Tema |
|---|---|---|---|---|
| R1 | `C:\Users\rpach\Videos\stress-test\hallazgos.md` | `R01-hallazgos.md` | sec/1.18.6-1 | Baseline completo F1–F13 |
| R2 | `C:\Users\rpach\Videos\stress-test\hallazgos-r2.md` | `R02-hallazgos.md` | sec/1.18.6-x | Re-test post-fix, validación |
| R3 | `C:\Users\rpach\Videos\stress-test\familias-errores.md` | `R03-familias-errores.md` | sec/1.18.6-x | Matriz de familias de error |
| R4 | `C:\Users\rpach\Videos\stress3\hallazgos-r4.md` | `R04-hallazgos.md` | sec/1.18.6-x | Tokens preview→apply, undo |
| R5 | `C:\Users\rpach\Videos\stress4\hallazgos-r5.md` | `R05-hallazgos.md` | sec/1.18.6-x | Efectos video/audio |
| R6 | `C:\Users\rpach\Videos\stress4\hallazgos-r6.md` | `R06-hallazgos.md` | sec/1.18.6-21/-22 | Ruta nativa UXP renderiza (PSNR 42–45) |
| R7 | `C:\Users\rpach\Videos\stress4\hallazgos-r7.md` | `R07-hallazgos.md` | sec/1.18.6-22 | Producción de shorts: Ultra Key, Ken Burns, beats/ducking, captions, e2e |
| R8 | `C:\Users\rpach\Videos\stress4\hallazgos-r8.md` | `R08-hallazgos.md` | sec/1.18.6-x | Barrida audio ×55 (driver), relink, render negro, QE/AME |
| R9 | `C:\Users\rpach\Videos\stress4\hallazgos-r9.md` | `R09-hallazgos.md` | sec/1.18.6-2x | Fix de lease verificado, remove por GUID |
| R10 | `C:\Users\rpach\Videos\stress4\hallazgos-r10.md` | `R10-hallazgos.md` | sec/1.19.0-4 | Floor r10, regresión marker-undo, triage reparador |
| R11 | `C:\Users\rpach\Videos\stress4\hallazgos-r11.md` | `R11-hallazgos.md` | sec/1.19.0-6 | Lease en vivo, #772, transcripts e2e, audio ×55 fase C |

**Importante:** NO están todos en la misma ruta (R1–R3 en `stress-test\`, R4 en `stress3\`, R5–R11 en `stress4\`). La carpeta `informe-consolidado\` es la vista única.

## 2. Estado de issues (lo que importa para decidir qué queda)

### Verificados ARREGLADOS en el fork (con evidencia de ronda)

| Issue | Origen | Fix verificado en |
|---|---|---|
| #710–#714 | R1 | R2 (batch post-fix) |
| #718/#719/etc R2 | R2 | rondas 3–5 |
| #728 | R4 (replay de token tras undo) | 1.18.6-22 → verificado R7 |
| #729 (relink hang) | R8 | 1.18.6-2x → verificado R9 |
| #730 (insert teleport) | R1 (clase) / R7 | 1.18.6-22 → verificado R8 |
| Guard #772 (transcribe crash `clip.getId`) | R7 (crash) | 1.19.0-6 → verificado R11 (started:true, transcript ≈100%) |
| Fix lease/arbitraje de pairing | R10 (floor) | 1.19.0-6 → verificado en vivo R11 (salto A→B→A2 sin matar A) |
| Point params (set_point_value) | R5/R6 | 1.18.6-21/-22 → verificado R7 (Ken Burns con PSNR) |

### ABIERTOS al cierre (no re-reportar; ya documentados)

| Issue | Contenido | Evidencia |
|---|---|---|
| **#718, #720, #721, #722** (R2) | Bugs de validación/contratos sin fix | `R02-hallazgos.md` |
| **#725** (R3, consolidado) | Enums no listados en errores (parcialmente mejorado en -4+: algunos enums ahora se listan; quedan instancias) | `R03-familias-errores.md` + R11 |
| **#733** (R10) | Regresión: undo de markers | `R10-hallazgos.md` |
| **#734** (R10, menor) | Consolidación de receipts | `R10-hallazgos.md` |
| **#735** (R8) | Efectos QE no-op en render por AME (PSNR infinito) | `R08-hallazgos.md` |

### Deudas de prueba conocidas (honestidad del reporte)

1. **Parser de audio del driver R8**: quedaba roto en memoria; la Fase C de R11 lo re-hizo con parser standalone y verificó 61 movimientos (59 con Δ≥3 dB vs fuente −4.9 dB) — **cerrado en R11**.
2. **Capa de receipts compartida** (sospecha de R10 sobre `undoSteps`): mi evidencia R1 muestra receipts con `undoSteps` fuera de `markers.ts`; falta `git log -S undoSteps` global en el repo para confirmar si la capa es compartida.
3. **Relink/offline e2e destructivo**: solo probes, nunca e2e completo (requiere corromper un fixture; bajo prioridad).
4. **Render negro global de R8**: se resolvió entre sesiones (R11 renderizó con YAVG 84); causa raíz no confirmada.

## 3. Lo que YA funciona bien (verificado, para no re-probar)

- **Puente UXP con sesión persistente** (`session-run.js`): ~0.46 s/llamada vs ~1.88 s CEP. Colas JSON con `{wait_ms}` inicial ≥15–30 s tras salto de lease.
- **Lease/arbitraje**: newest-claim gana, heartbeat reescribe, server vivo-idle bloquea adopción (anti hold-server). Muerte correcta de zombis: `Get-CimInstance Win32_Process` filtrando `CommandLine` por `premiere-pro-mcp` (los node de Codex/chrome-devtools NO se tocan).
- **Pipeline de render**: CEP `add_to_render_queue` + `start_batch_encode` (preset H264 escribe .mov válido); PSNR objetivo ≥40 dB en efectos nativos.
- **Transcripts e2e (R11)**: `transcribe_clip_uxp` started:true, precisión ≈100% vs `voz-texto.txt`, `search_clip_transcript_uxp` con hits, `plan_transcript_rough_cut_uxp` preview con token, `build_caption_artifact` SRT de 8 cues importado.
- **Audio**: 61 movimientos de volumen verificados por medición ffprobe (no por receipt).
- **Ken Burns nativo**: keyframes Position/Escala con movimiento real en render (R7).
- **Artefacto clave para agentes nuevos**: `C:\Users\rpach\Videos\stress4\runs\r11-tools-schemas.json` (1.06 MB) — inputSchemas completas de 480 tools. **Un agente nuevo debería leer ESTE archivo antes de llamar nada.**

## 4. El hallazgo transversal (resumen ejecutivo)

El patrón que cruza las 11 rondas y que NINGÚN fix puntual cerró: **los contratos de las tools no se auto-describen en el momento del fallo**, así que cada agente nuevo "calibra al aire" — tantea cuántas variables admiten, qué enums existen, qué semántica tiene cada parámetro — gastando tokens repetidamente en sesiones nuevas. Instancias y propuesta de caza de la familia: ver **`FAMILIA-CONTRATOS-NO-SELF-DESCRIBING.md`** (documento hermanado con este).

## 5. Estado final del entorno (verificado al cierre de R11)

- Fixture canónico restaurado: `stress4.prproj` → secuencia CromaTest V1 = `bg_grad` 0–8 s (startSeconds 0), Opacidad 100 estática, A1/A2 vacías, sin residuos. Proyecto **guardado**.
- AME cerrado tras renders. **0 servers zombi** (verificado por CommandLine).
- `Publi PK` y proyectos de producción: **jamás tocados** (regla de todas las rondas).
- No se hizo git add/commit/push ni se crearon/comentaron/cerraron issues desde las rondas recientes (regla vigente).
