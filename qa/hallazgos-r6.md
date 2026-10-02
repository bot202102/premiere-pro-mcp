# Ronda 6 — Ruta UXP nativa (sec/1.18.6-20, 92 tools `*_uxp`)

- **Fecha:** 2026-10-02
- **Proyecto:** stress4.prproj / secuencia CromaTest (fixture canónico restaurado: `bg_grad.mp4 0–8s en V1`, 1 item, guardado vía `save_project_uxp`)
- **Evidencia cruda:** `runs/r6-*.json` (cada paso con save_raw) + capturas PNG en `efectos/`
- **Veredictos:** VERDE / honesto-falla / FALLO

## A. Operativo (infra Multi-agente)

| # | Hallazgo | Clase |
|---|---|---|
| A1 | 6 servers `premiere-pro-mcp` zombi de sesiones previas retenían puertos/panel → limpieza previa OBLIGATORIA (`Get-CimInstance` + Stop-Process). CUIDADO: el filtro por CommandLine también captura bash/greps propios; los node de Codex-CUA y chrome-devtools-mcp NO se tocan | operativo |
| A2 | El panel tarda 2–8 s en saltar al pairing nuevo: **toda cola debe abrir con `{"wait_ms":8000}`** — sin ello, mass-falsos "Premiere UXP bridge is not connected" (las colas suministradas no lo llevaban) | operativo |
| A3 | El pairing queda apuntando al server muerto entre sesiones; inofensivo si la siguiente sesión espera el hop | operativo |
| A4 | Guardas `expected_*` = protección real multi-agente: undo/playhead con expectativa rancia → rechazo nombrando el estado real (undo stack 76 vs 29; playhead "changed before set") | VERDE |

## B. F2 — Edición nativa

| Sonda | Veredicto |
|---|---|
| **#730 nativo**: `edit_timeline_uxp insert` @2s DENTRO de clip 0–8 | **VERDE — sin teleport**: layout `0–2 \| 2–10 \| 10–16`, cola pegada tras el insert como la UI. Receipt honesto `committed_unverified / verified:false` + `undo.supported:true` + transacción atómica declarada |
| insert sin `audio_track_index` | honesto-falla: "audioTrackIndex must be a non-negative integer" (exigido también en items solo-vídeo) |
| `project_item_id` | **FALLO de descubribilidad**: ni nombre ("bg_grad"), ni "bg_grad.mp4", ni nodeId CEP — solo el GUID estable UXP (obtenible del receipt del primer insert, o por selección única del panel + omisión del arg). `inspect_project_tree_uxp` roto ("The project root did not expose a stable ID") ⇒ **no hay ruta nativa para descubrir GUIDs de items** |
| markers add/inspect/remove por GUID | VERDE (3/3, receipts verified); GUID inventado → "markerGuid was not found" sin mutar |
| insert sin args | honesto-falla, pero nombra SOLO el primer campo faltante ("timeSeconds must be from 0 to 86400") — menor: no lista todos |
| save_project_uxp | VERDE (verified, projectGuid) |

## C. F3 — Efectos/parámetros nativos (la puerta a #735)

| Sonda | Veredicto |
|---|---|
| `manage_clip_effects_uxp catalog` | VERDE — **108 matchNames** (incl. `AE.ADBE Lumetri`, `AE.ADBE Ultra Key`, `AE.ADBE Color Key`, `AE.ADBE Tint`…) |
| `add` Gamma Correction con `expected_effect_id` | **VERDE — componente REAL** (visible en inspect estándar; a diferencia del QE-CEP de #735) |
| `automate set_value` Gamma 10→25 | VERDE — readback 25 verificado |
| **PSNR controlado** (misma composición t=1, solo gamma) | **HALLAZGO MAYOR: PSNR 42–45 dB — LA RUTA NATIVA RENDERIZA EFECTOS.** #735 queda respondido: existe HOY una vía productiva de color/efectos por UXP (frames `r6-t1-gamma10/25.png` + receipts) |
| `add_keyframe` directo | VERDE (committed_unverified con before/after) |
| `inspect_point_value` | **FALLO**: siempre "args must be an object" (con o sin args) ⇒ cadena rota: `set_point_value` exige su `expected_point_snapshot` ⇒ **keyframing por puntos bloqueado** (la vía `add_keyframe` directa sí vive) |
| `remove` con `expected_effect_id` erróneo | VERDE fail-closed: "component at componentIndex no longer matches expectedEffectId" |
| `remove` correcto | VERDE (removed:true, verified) |
| nota | `set_value` escalar NO pide confirmación (solo `set_color_value` pide `confirm_set_color` según esquema; no ejercitado por falta de parámetro de color en el clip de prueba) |

## D. F4 — Transiciones + export/encode

| Sonda | Veredicto |
|---|---|
| `list_video_transitions_uxp` | VERDE — catálogo completo (Additive/Film Dissolve, Push, Wipes…) |
| `add/inspect_video_transition_uxp` | **honesto-falla por hueco de Adobe**: "This Premiere build cannot read a complete video-transition target snapshot: **VideoClipTrackItem.hasVideoTransition is unavailable**" — fail-closed sin mutar; la ruta existe y vivirá cuando Adobe exponga la propiedad. (En CEP era no-op silencioso; en UXP al menos es honesto.) |
| `expected_target` | exige bloque de identidad COMPLETO (sequence_guid, track, clip, project_item_id, start/end, position, transition_present) — la guarda rechazó un bloque parcial antes de tocar el host ✓ |
| `export_aaf_uxp` / `export_interchange_uxp` / `configure_encoder_uxp` / `encode_media_uxp` | honesto-falla ×4: "host does not support UXP command 'interchange.aaf.export' / 'interchange.export' / 'encoder.configure'" — el panel 26.5.2 no implementa la familia export/encode |

## E. F5 — Contratos

| Sonda | Veredicto |
|---|---|
| `manage_sequences_uxp activate` GUID inexistente | VERDE honesto: "sequenceId was not found" sin cambiar la activa |
| `clone` | **VERDE** — `CromaTest copia` creada y verificada (capacidad sin equivalente CEP probado). Detalle: rechaza `name` extra listando args aceptados (clone = copia espejo) |
| `make_split_edit_uxp` (L-cut) | honesto-falla "clipIndex is out of range" — fixture sin audio (documentado por la propia cola) |
| `preflight_production_storage_uxp` | esquema distinto al asumido: exige `action` (preflight\|configure_project); no sondeado a fondo |
| `manage_timeline_selection_uxp` (replace/add) | **FALLO**: Premiere rechaza la construcción incluso con 1 clip e identidad completa ("Premiere rejected a clip while constructing the timeline selection"); con GUID erróneo → "Timeline item N changed" (fail-closed correcto). `remove_selection` queda inusable por esta vía |
| `edit_timeline_uxp remove_selection` | el comando de panel **no acepta** flag de confirmación ("Unknown argument: confirmNonUndoable") — contrato distinto al asumido en la cola |
| `save_project_uxp` ×2 | VERDE idempotente (verified ambas) |
| Estado final | VERDE — fixture canónico (1 item), proyecto guardado |

## Resumen

- **La ruta UXP nativa es productiva HOY para**: edición (insert/overwrite sin teleport), markers, playhead, secuencias (clone/activate), **efectos de biblioteca + parámetros + keyframes directos con render real** (PSNR 42–45 dB controlado) — resuelve los dos grandes dolores CEP (#730 y #735).
- **Rota/bloqueada en nativa**: selección de timeline (Premiere rechaza), keyframes por puntos (inspect_point_value), transiciones (hueco Adobe `hasVideoTransition`), familia export/encode (panel no implementado), descubrimiento de GUIDs de items (project tree sin ID estable), `ripple_delete_track_item_uxp` ("bridge not connected" siempre).
- **Contratos**: receipts honestos en todo (committed_unverified declarado, renderVerified/false explícito), errores que listan enums/args válidos (mejora neta vs CEP), guardas `expected_*` que fallan cerrado — incluida su utilidad multi-agente real.

## Post-triage del reparador (02-10 noche, fork sec/1.18.6-21)

| Defecto de la ronda | Veredicto del triage | Acción |
|---|---|---|
| C-`inspect_point_value` "args must be an object" siempre | **BUG REAL ×2 en el panel upstream**: (1) Premiere UXP devuelve puntos como **array `[0.5,0.5]`** y el panel solo aceptaba `{x,y}` → inspección rota en TODO parámetro de punto real (Motion/Posición repro incluido); (2) sobre escalares el mensaje era el genérico engañoso. El keyframing por puntos NUNCA estuvo bloqueado — estaba mal diagnosticado | **FIX en fork** (sec/1.18.6-21): normalización `[x,y]`→`{x,y}` + `UXP_PARAMETER_NOT_POINT/NOT_COLOR` con nombre de parámetro/componente. Verificado en vivo: Posición → `point {x:0.5,y:0.5}`; Opacidad → mensaje claro. **Issue upstream [#765](https://github.com/leancoderkavy/premiere-pro-mcp/issues/765)** con repro completo |
| B/`ripple_delete_track_item_uxp` "bridge not connected" siempre | **FALSO POSITIVO operativo**: en vivo la tool responde legítimo ("requires one immediate following clip") — el fixture canónico tiene 1 clip. Los "not connected" del tester fueron ventanas de pairing (A2) | Sin fix; A2 (espera 8s) es la cura. Corregido en este anexo |
| D/transiciones `hasVideoTransition` | Hueco de Adobe confirmado (fail-closed honesto del panel) | Sin acción local; queda en la watch-list de gaps Adobe junto a #687/#735 |
| D/export/encode familia | El hello del panel declara esos comandos no-soportados en 26.5.2 — comportamiento documentado, no bug | Matriz §5 de ESTADO-MAESTRO actualizada |
| B/descubrimiento de GUIDs (`inspect_project_tree_uxp`) | Roto upstream ("project root did not expose a stable ID"); workaround válido: receipt del primer insert o selección única | Candidato a issue upstream aparte si acumula con otros |
| E/selección de timeline rechazada | Falla del host (Premiere rechaza la construcción, no del panel/server) | Watch-list Adobe |

### Barrida de familia (02-10 noche II, sec/1.18.6-22)

Misma clase de defecto (forma del valor del host vs validador del panel + mensajes genéricos):

| Sonda | Resultado |
|---|---|
| `set_point_value` roundtrip completo (Motion/Posición) | **VERIFIED ×2**: 0.5/0.5 → 0.6/0.45 con readback float32 (`0.6000000238…`) y restore. La cadena inspect→snapshot→set→readback funciona de punta a punta tras la normalización |
| `colorParameterSnapshot` con arrays | Parche preventivo: normaliza `[r,g,b]`/`[r,g,b,a]` → `{red,green,blue,alpha}` (misma clase que `[x,y]`) |
| Colores del Tint en vivo (`Asociar negro a`/`blanco a`) | El host devuelve `value: null` por `getStartValue` (color interno del efecto) → nuevo `UXP_VALUE_UNAVAILABLE` honesto nombrando parámetro/componente (antes decía "escalar", mentira) |
| `inspectPointParameterDisplacement` | Revisado: ya falla cerrado honesto ("native PointF values with distanceTo") — sin cambio |
| Server-side `must be an object` (clone/slide/ripple/dialogue .ts) | Mensajes nombran el campo — limpios, sin cambio |
| Fixture | Restaurado y verificado: Position `{0.5,0.5}` (set verified), Tint removido (componentes 0:Opacity 1:Motion), `save_project_uxp` verified |

Fork: **sec/1.18.6-22** (suite 4675/0; tarball `6dc10488…`, ccx `b4865809…`). #765 actualizado con la barrida.
