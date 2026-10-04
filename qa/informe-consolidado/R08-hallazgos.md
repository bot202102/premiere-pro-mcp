# Ronda 8 — Barrida de amplitud de efectos + matriz de interpolación + hallazgo mayor de render

- **Fecha:** 2026-10-02/03 (noche)
- **Build:** fork bot202102 **sec/1.19.0-1** (driver `sec-tools/r8-effect-sweep.js`, commit 11b6b41)
- **Proyecto:** stress4.prproj (CromaTest canónico `bg_grad 0–8 en V1`)
- **Evidencia:** `runs/r8-sweep/` (results.json/md, audio-results.json, 108 filas) + `runs/r8-*.json/png` + frames en `efectos/`

## RESULTADO PRINCIPAL

**107/108 efectos de biblioteca de vídeo RENDERIZAN por la ruta nativa** (PSNR finito 17–24 dB tras tocar 1 param escalar). 0 no-ops. 1 efecto sin param escalar (Black & White — solo dropdown, no aplicable). La amplitud del catálogo está viva: Mosaic, Twirl, Wave Warp, Drop Shadow, Replicate, Invert (5.89 dB dramático), Lumetri-family, Levels, Lens Distortion, Extract, Gamma, disolvencias de bloque… **la pregunta de amplitud queda respondida: la ruta nativa renderiza la biblioteca.**

Tabla completa: `runs/r8-sweep/results.json` (108 filas: matchName, param tocado, valor, PSNR).

## F4 — Matriz de interpolación (regresión)

Keyframes Opacidad 100@0.5 → 0@2.5 (datos almacenados EXACTOS, verificados por get_keyframes CEP). Capturas por modo (linear/hold/bezier), luminancia media franja central:

| Modo | t1.5 | t2.45 | t2.6 |
|---|---|---|---|
| linear | 0.0 | 0.0 | 0.0 |
| hold | 0.0 | 0.0 | 0.0 |
| bezier | 0.0 | 0.0 | 0.0 |

**Los 9 puntos negros.** Contexto del hallazgo: durante los tests de easing (pre-matrix), t1.5 daba ~78 (brillante) y t2.6 daba 0.0 — la curva de opacidad se corrompió al tocar interpolaciones: **el segmento entero rinde negro** (opacidad efectiva 0 en todo el clip) en TODOS los modos. Los datos leen bien; el render no los honra. Consistente con el hallazgo de R8-lite (interpolación declarada no aplicada), ahora agravado: ni siquiera el valor base se honra tras set_interpolation. Al limpiar los keyframes y fijar estático 100 → **sigue negro** (ver sección MAJOR).

## ⚠️ HALLAZGO MAYOR — render global negro post-sweep (persistente a reinicio)

Cadena de evidencia:
1. Tras la barrida de 108, **TODAS las secuencias de stress4 renderizan NEGRO** (CromaTest con bg brillante + opacidad 100 verificada; R7Short con caption blanca visible sobre negro — la caption track rinde, el vídeo no).
2. `capture_frame` (CEP, renderer vivo), **y AME** (`add_to_render_queue` → mov 720×1280 verificado con ffprobe) — ambos negros.
3. **Persiste tras reiniciar Premiere** (kill + relaunch + reopen) y tras `delete_preview_files`.
4. El estado del proyecto lee LIMPIO: clip enabled, track visible/no-mutada, media online (check_offline 0), componentes solo Opacity(100, sin kf tras limpieza)+Motion, fuente `efectos/bg_grad.mp4` íntegra (lum 73.4 verificada con ffmpeg directo).
5. La caption renderiza blanca ⇒ el pipeline de composición vive; **los clips de vídeo aportan negro**.
6. Recuperación NO encontrada en sesión: reinicio de app + purge de previews insuficiente (pendiente: reinicio de máquina / reset GPU / recrear proyecto).

Sospecha principal: los 108 ciclos add/remove de efectos de biblioteca en un mismo clip dejaron el renderer de la secuencia/proyecto en estado fallido (silencioso). Repro exacto: driver `runs/r8-effect-sweep.cjs` tal cual (logs `r8-phase1-full.log`), fixture canónico → negro global.

## Defectos del driver encontrados por el smoke (documentados, NO corregidos en el repo)

1. **Packaging**: driver CommonJS `.js` dentro de paquete `"type":"module"` → `require is not defined` tal cual se shippea (workaround del tester: copia `.cjs` fuera del repo).
2. **Captura inline**: `capture_frame` devuelve imagen base64 inline; el driver buscaba una ruta de fichero en el texto → "FATAL no pude extraer el path" (parche del tester: guardar base64).
3. **Forma del catálogo**: el catálogo expone arrays paralelos `matchNames[]`/`displayNames[]` (y audio SOLO `displayNames` es-ES); el walk del driver buscaba objetos con clave `matchName` → 0 efectos (parche del tester: cincerar arrays).
4. **PSNR invisible**: ffmpeg con `-v error` no imprime la línea `average:` que el regex busca → todo "s/dato" (parche: quitar `-v error`).
5. **Cache de captura por time_seconds**: baseline y capturas pedían el MISMO t=4 → frame cacheado → **toda la barrida reportaba NO-OP falsamente** (parche: clave única por efecto). Con captura sin clave de tiempo (`{}`) el driver sí detecta renders (4ColorGradient 23.8, AECrop 23.8…). **Este defecto habría invalidado toda la ronda de no haberse encontrado en el smoke.**
6. Menores: loop de params hacía `break` en el primer inspect error y solo barría 8 params (parches: continue + 24); remove exige `component_index` (los índices bailan → re-inspección entre removes, 2 pasadas para 18 componentes apilados).

## Fases

| Fase | Resultado |
|---|---|
| 0 smoke | Validó el bucle tras 5 parches (arriba) |
| 1 vídeo 108 | **107 renderizan**, 1 s/dato (B&W sin escalar), 0 add-falló, 0 notes |
| 2 audio 55 | Parada a mitad por defectos del driver (volumedetect sin parse + remove sin component_index + efectos apilándose en el clip). **Evidencia de cadena de audio productiva ya existente**: EQ +21 dB → max 0.0 dB clipping vs fuente −4.9 (R8-lite). Barrida completa de 55 pendiente de re-drive corregido |
| 3 no-ops | 0 no-ops reales (la segunda pasada sobra salvo B&W) |
| 4 matriz | 9/9 capturas ejecutadas; resultado corrupto-negro (ver MAJOR + sección F4) |

## Estado final

- Fixture canónico POR DATOS: CromaTest V1/clip0 = bg_grad 0–8, componentes Opacity(100 estático tras limpieza)+Motion, sin keyframes; proyecto guardado.
- **RENDER: NEGRO global en stress4 (persistente a reinicio de app) — pendiente de reinicio de máquina / triage del agente.** La captura de otras secuencias (R7Short) también negra por estar vaciada (limpieza de residuos, caption visible = pipeline vivo).
- Puente UXP sano; AME cerrado; "CromaTest copia" eliminada.
- Nota: existe fichero `stress4.prin` (artefacto de guardado interrumpido) — candidato a limpieza por el agente.

---

## F-OP-1 (elevado a hallazgo) — El self-healing del panel NO cubre servers zombi vivos: secuestro del panel hasta kill manual

**El fallo:** al arrancar la R8, la primera cola falló completa con "Premiere UXP bridge is not connected" habiendo un server `premiere-pro-mcp` (node PID 31652) VIVO pero huérfano de una sesión anterior. El panel seguía pegado a ese server; el nuevo server escribió su pairing y esperó >60 s sin ser adoptado. **El tester tuvo que matar el zombi a mano** (`taskkill /PID 31652 /T /F`) — el siguiente server conectó al primer intento.

**Por qué es un fallo del plugin y no del tester:** el mecanismo SEC 10 documentado (auto-pairing + self-healing) cubre el caso "server MUERE → onclose → el panel re-lee el pairing". NO cubre el caso **"server huérfano pero VIVO"**: el proceso queda retenido (p. ej. el harness anterior no hizo tree-kill, o murió su cliente sin cerrar el stdin), su socket con el panel sigue ESTABLISHED, el evento `onclose` nunca dispara, y el panel **nunca re-lee el pairing** mientras tenga conexión. Resultado: un server abandonado secuestra el panel indefinidamente y **cualquier tool nueva responde "not connected" aunque el server nuevo esté sano y el pairing sea más nuevo**.

**Evidencia R8 (pre-flight, reproducible):**
1. `Get-CimInstance Win32_Process` → node PID 31652 con `premiere-pro-mcp` en CommandLine, vivo, sin sesión asociada.
2. Cola nueva (`get_uxp_state` + inspect) → ambas llamadas `isError: "Premiere UXP bridge is not connected"` durante >60 s (el server nuevo había escrito pairing con puerto dinámico nuevo).
3. `taskkill /PID 31652 /T /F` → 0 procesos → re-intento inmediato → `get_uxp_state` ok (`backend:"uxp"`), sesión completa funcionando.

**Recomendaciones de fix (para el plugin, en orden de robustez):**
1. **Lease/heartbeat del pairing**: el panel re-valida el fichero de pairing periódicamente (p. ej. cada 30 s o tras N fallos seguidos de comando) aunque su conexión siga ESTABLISHED; si `issuedAt`/`pid` del fichero es más nuevo que el server al que está conectado, salta.
2. **Self-retire del server**: al arrancar, un server nuevo podría avisar a los servers previos (pid registrado en el pairing anterior) para que se retiren (o el nuevo adopta con takeover del puerto 7777 matando al ocupante legítimo del mismo binario).
3. Mínimo defendible: documentar en el contrato del tester que el **paso 0 obligatorio** es el sweep de zombis (`Get-CimInstance … | Stop-Process`), hoy solo implícito.

**Notas de campo relacionadas (misma sesión):** durante R7/R8 se encontraron hasta 6 servers zombi simultáneos (algunos de sesiones del agente de reparaciones, algunos propios con `shell:true` sin tree-kill) — el multi-agente agrava el problema porque cada harness muerto deja un secuestrador potencial del panel.

---

## POST-TRIAGE DEL REPARADOR (03-10, fork sec/1.19.0-2)

### MAJOR "render negro global" → **FALSA ALARMA RESUELTA (sin corrupción alguna)**

Cadena de discriminación (drivers `runs/r8-triage-e1..e6.cjs`):

| Experimento | Resultado | Conclusión |
|---|---|---|
| E1: secuencia NUEVA (misma media) | centro YAVG 49.9, YMAX 127 → **renderiza** | NO es host/GPU/proyecto |
| E4: ground truth de CromaTest | estructura real: **bg_grad en `startSeconds:120–128`** (no 0–8) | el clip estaba APARCADO en el segundo 120 |
| E5: captura/render tras restaurar | **YAVG 84 en t=4** | renderiza perfectamente |

**Causa raíz:** el fixture "canónico" del cierre de R8 no lo era — el clip quedó
estacionado en 120–128 (por eso `end:128` y el `.prin`); toda captura en t≤8 caía en
timeline vacía → negro + caption. Los datos "0–8" que se leyeron eran in/out del clip,
no su posición. AME "negro", persistencia al reiniciar, y la matriz F4 "9/9 negros"
— todo consecuencia de medir zona vacía. **La matriz F4 queda INVALIDADA como evidencia**
(hay que re-mesurarla sobre fixture correcto; el hallazgo R8-lite de interpolación —
receipt verified + render en steps — sigue en pie como observación, pendiente de esa
re-medición).

**Estado final REAL:** fixture canónico VERDADERO restaurado y renderizando
(`bg_grad 0–8` único clip en V1 de CromaTest, YAVG 84 verificado, proyecto guardado);
secuencias de triage eliminadas (R8-Triage, CromaTest copia); `stress4.prin` borrado.
Nota de contratos: `get_clip_at_position` usa `time_seconds` (no position_seconds);
`inspect_sequence_structure_uxp` usa `sequence_id/media_type/max_items`;
`duplicate_sequence` NO activa la copia; `manage_sequence_playhead_uxp set` exige
`expected_sequence_guid`.

### F-OP-1 → **FIX implementado (lease del pairing)**

`uxp-plugin/index.cjs`: lease de 15 s — el panel re-lee el fichero de pairing aunque
su conexión siga ESTABLISHED y salta cuando el **pid escritor cambia** (last-writer-wins,
semántica documentada). Se compara pid y no issuedAt a propósito: el heartbeat propio
refresca issuedAt cada 5 s y el panel no debe flappear contra sí mismo. El nivel 2
(self-retire matando al ocupante) se DESCARTA deliberadamente: matar procesos de otra
sesión podría ejecutar el server legítimo de Codex — con el lease, el zombi deja de
ser dañino (pierde el panel sin morir) y el paso 0 del sweep queda como higiene, no
como requisito de supervivencia. Live-verificación completa del lease pendiente del
próximo reinicio natural de Premiere (el salto usa el mismo camino refreshPairing ya
verificado; el diff es el timer + comparación de pid).

### Driver
Adoptado al repo el `.cjs` del tester (batalla-probado 107/108) en lugar del `.js`
de primera generación — los 6 defectos que el smoke cazó quedan así blindados en
`sec-tools/r8-effect-sweep.cjs`.
