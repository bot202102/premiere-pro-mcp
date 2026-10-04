# Ronda 9 — Lease del pairing en vivo + matriz de interpolación válida + audio

- **Fecha:** 2026-10-03
- **Build:** fork bot202102 **sec/1.19.0-2** (lease del pairing implementado — verifica F-OP-1 de R8)
- **Proyecto:** stress4.prproj — **fixture canónico restaurado y guardado**: CromaTest V1 = bg_grad 0–8, Opacidad 100 estática (tv:true kf:0 residual, plano a 100), sin efectos, sin audio
- **Evidencia:** `runs/r9-*.json/png` + `efectos/r9-mx-*.png` + `runs/r8-sweep/audio-results.json`

## FASE 0 — Arranque canónico

| Paso | Veredicto |
|---|---|
| Kill Premiere + sweep zombis (0 reales) + server arriba ANTES + abrir stress4 | VERDE — auto-empareje al boot |
| `get_uxp_state` | VERDE — backend uxp, CromaTest |
| **Captura t=4 → YAVG 84.01** | **VERDE — fixture RENDERIZA (el negro global de R8 quedó resuelto entre sesiones)** |

## FASE A — Lease del pairing (verificación en vivo del fix F-OP-1)

Protocolo dos servers con polling alternado (A 30 sondeos ×10 s, B 15 ×10 s):

| Evento | t (relativo) | Observación |
|---|---|---|
| A arriba, panel conectado a A | 0 | A: 6 llamadas ok seguidas |
| B arriba, escribe pairing (pid nuevo) | +0 s | primera llamada de B: 1 error (esperable, aún en A) |
| **Salto A→B** | ≤ 20 s de B | **A: 6 ok → 6 err; B: 0 err → 6 ok. El panel saltó SOLO, sin matar a A** |
| Kill del server B (wrapper) | +75 s | matiz: el wrapper cmd murió pero el node hijo sobrevivió (19820) — el kill correcto es del node |
| Estado post-kill | — | panel correctamente en B (vivo + pairing vigente) |
| Muerte real de B + nueva sesión | +3 min | panel re-adoptó la nueva sesión (A2: 4/4 ok) — retorno por onclose/nuevo pairing VERDE |

**VERDE con 2 matices documentados:** (1) matar el wrapper cmd de `shell:true` no mata el node hijo — el kill debe apuntar al node (ya documentado en R6 nota 15, confirmado en vivo); (2) durante la convivencia A+B, A siguió respondiendo varias llamadas ok mientras B también ok — el lease convive ~30-60 s antes de estabilizar en el más nuevo (transición gradual, no instantánea; timing exacto en `runs/r7/r9-A-*.json` mtimes).

## FASE B — Matriz de interpolación sobre fixture VIVO (YAVG base 84)

Keyframes escritos y leídos de vuelta EXACTOS: 100@0.5 → 0@2.5 (tv:true, kf:2, valores verificados con get_keyframes CEP tras cada modo). Capturas con `capture_frame {time_seconds}` + YAVG signalstats:

| Modo | t1.5 | t2.45 | t2.6 |
|---|---|---|---|
| linear | **83.96** | **84.24** | **16.70** |
| hold | **83.99** | **84.33** | **16.70** |
| bezier | **83.97** | **84.24** | **16.70** |

**VEREDICTO (medición válida sobre fixture que renderiza — reemplaza la matriz inválida de R8):** los 3 modos son INDISTINGUIBLES (±0.3 = ruido de compresión): el render mantiene el valor base (~84) hasta pasando el kf final y hace SNAP al valor final después. **El render NO honra interpolación de keyframes en ninguna modalidad** — confirma y cuantifica el gap Adobe de R8-lite. Los DATOS son correctos en disco (readback exacto) ⇒ separación neta datos/render.

Limpieza: keyframes eliminados, tv residual (kf:0) documentado como menor, opacidad estática 100, captura final t1 = 83.95 ✓.

## FASE C — Barrida de AUDIO (55 efectos)

| Intento | Resultado |
|---|---|
| Driver tal cual (R8) | "clipIndex out of range" — fixture sin clip de audio |
| Con música + driver | 9 min → 9 movs renderizados PERO max null (volumedetect en-sesión tras render incompleto) + SIN REMOVER (remove exige component_index; el componente añadido se llama por GUID, no por displayName) + efectos apilándose |
| Driver parcheado (4 fixes: preIds para nuevo componente, remove por GUID real, volumedetect con estabilización, loop continue+24) | smoke ×3: parado — **el flujo audio del driver sigue roto tras 2 rondas de parches** (param→medición); **documenta y para** según reglas |
| **Evidencia productiva de audio (consolidada)** | **2 efectos renderizan audible**: EQ +21 dB → clipping 0.0 dB (R8-lite) y "Agudos" add-only → Δmax −3.0 dB (mov `audio-000_1.mov`) vs fuente −4.9 dB |

**Fase C = PARCIAL:** cadena de audio de efectos CONFIRMADA productiva (2/2 probados a fondo), barrida completa de 55 bloqueada por el driver audio (requiere re-drive con: remove por GUID real, volumedetect post-estabilización fuera de sesión, y strategy de param-touch por add_keyframe en TV params). Parches aplicados a mi copia quedan documentados arriba.

## Hallazgos/menores R9 (sin issue individual, consolidados)

1. El render HONORA tiempos de keyframe como pasos (hold) pero ignora el modo de interpolación — valida el gap Adobe con medición limpia (matriz arriba).
2. `set_interpolation` acepta y persiste el modo (readback) — solo el RENDER no lo honra.
3. Opacidad queda tv:true kf:0 tras remover todos los kfs (inofensivo, plano al base).
4. El arranque canónico server→Premiere funcionó; las sesiones de sondeo de ~30 s mueren antes de que el panel las adopte si el panel está en boot (usar wait_ms ≥ 30 s en la primera cola tras abrir Premiere).

## Estado final

- Fixture canónico: **CromaTest = bg_grad 0–8 en V1, Opacidad 100 estática, sin keyframes/efectos/audio** — verificado y GUARDADO (save_project).
- Puente UXP sano; servers de prueba cerrados al cierre.
- Evidencia: `runs/r9-*.json/png`, matriz en `efectos/r9-mx-*.png`, audio en `runs/r8-sweep/audio-*.mov` + `audio-results-parsed.json`.

---

## POST-TRIAGE DEL REPARADOR (03-10, fork sec/1.19.0-3)

### Fase A (lease) → **CONFIRMADO EN VIVO, fix validado**
Salto A→B sin matar a A (6 ok→6 err / 0→6 ok) + recuperación tras muerte de B.
Los 2 matices documentados son correctos: (1) matar el wrapper `cmd` de `shell:true`
no mata el node — el kill correcto apunta al PID del node (ya era trampa #15 del
ESTADO-MAESTRO); (2) la transición A→B es gradual (~30-60 s de convivencia) porque
el lease sondea cada 15 s y el socket viejo muere en su próximo ciclo de reconexión.
La Fase A cierra el ciclo F-OP-1: implementado → verificado → archivado.

### Fase B (matriz) → **GAP ADOBE CONFIRMADO con medición limpia** → upstream [#771](https://github.com/leancoderkavy/premiere-pro-mcp/issues/771)
Los 3 modos indistinguibles (±0.3) con datos exactos en disco = separación neta
*datos correctos / render no honra*. Acciones: (1) **receipt honesty** — los receipts
de `set_interpolation` del fork ahora llevan `renderHonesty` advirtiendo que el render
puede no honrar la curva (FORK-DIVERGENCE, KEEP); (2) **issue upstream #771** con la
tabla limpia de R9 como evidencia y la sugerencia de disposition. La matriz queda
como suite de regresión permanente (re-ejecutar cuando Adobe publique build nueva).

### Fase C (audio) → **driver completado en el repo** (re-drive listo para R10)
Los 3 defectos restantes corregidos en `sec-tools/r8-effect-sweep.cjs`: cascada de
valores candidatos cubriendo ambas formas de error de rango del host
("must be from A to B" y "must be a finite number from A to B"), loop de 24 params
con continue, y volumedetect con retry tras tamaño-estable del render. Con los
parches de campo del tester ya absorbidos (detección del componente por diff pre-add,
remove con id detectado). **Re-drive de los 55 en la próxima ronda.**

### Nota operativa adoptada
Primera cola tras abrir Premiere: `wait_ms ≥ 30000` (boot del runtime UXP).
Actualizado en AGENTS.md (regla 4) y prompts.

### Estado final verificado
Fixture canónico (bg_grad 0–8, opacidad 100 estática) + proyecto guardado + puente
sano. Fork: **sec/1.19.0-3** (suite 4692/0, SELLO OK, tarball reinstalado + pineado).
