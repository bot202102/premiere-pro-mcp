# Matriz de familias de errores — stress-test MCP Premiere (ronda 3)

- **Fecha:** 2026-10-01
- **Proyecto:** stress2.prproj (secuencia R2T), mismo entorno que rondas 1-2
- **Clasificación:** OK-honesto = falla cerrado nombrando causa · HALLAZGO = éxito silencioso, mutación, error engañoso o contrato débil
- **Logs crudos:** `runs/fam*.txt`

## FAM-1 · Argumentos requeridos ausentes — 10 sondas
| Sonda | Resultado | Clase |
|---|---|---|
| get_clip_properties / set_active_sequence / add_marker / update_marker / delete_marker / find_project_item_by_name / set_footage_interpretation con `{}` | "data must have required property 'x'" | OK-honesto |
| **`undo {}` / `multiple_undo {}` / `redo {}`** | **EJECUTAN el undo/redo sin guard** (29→28, 27→26, 26→27). El fail-closed de `expected_undo_stack_index` es OPCIONAL | **HALLAZGO (diseño)** |
| multiple_undo count con expected correcto/incorrecto | guarda funciona (rechaza 27≠0) | OK-honesto |

## FAM-2 · Tipos incorrectos — 7 sondas
opacity "50", duration "3", time "five", name 123, node_id 123, width "720", keyframes objeto → **7/7** "data/x must be number|string|array". **Clase: OK-honesto (100%).**

## FAM-3 · Valores fuera de rango — 10 sondas
| Sonda | Resultado | Clase |
|---|---|---|
| duration 0 / -5 | "must be > 0" | OK |
| trim out -3 | "must be >= 0" | OK |
| marker t=-5 | "must be a finite, non-negative number" | OK |
| in>out secuencia | "did not apply… observed -400000 to 5" | OK (honesto; readback raro pero fail-closed) |
| **playhead -10 s y 999999 s** | aceptados, eco sin clamp ni warning (navigate_playhead sí reporta `clamped`) | **HALLAZGO menor** |
| **volume +100 dB** | Premiere clampéa a nivel 1.0 (=0 dB) pero receipt dice `volumeDb:100` — ecoa lo pedido, no lo aplicado (el campo `level` sí delata) | **HALLAZGO menor** |
| rotation 99999 | "Could not set rotation" (además R2-05/#722) | OK fail-closed |

## FAM-4 · IDs malformados/inexistentes — 8 sondas
"", "zzzz", "00000000", formato válido no usado, UUID nulo, no-UUID, clip borrado, UUID de secuencia en tool de clip → **8/8** "Clip not found"/"Sequence not found". **Clase: OK-honesto (100%).**

## FAM-5 · Paths hostiles — 6 sondas
| Sonda | Resultado | Clase |
|---|---|---|
| open/import/inexistente, traversal, import_folder inexistente | errores precisos con ruta normalizada | OK |
| #713 fix (path inexistente import_media) | rápido y explica el modal | OK (FIXED confirmado) |
| **import array vacío** | `Error: Import failed` — vago, no dice "lista vacía" | **HALLAZGO menor** |
| import de un DIRECTORIO | `imported: 1` + campo `files:[<dir>]` — lo mete como bin (legítimo de Premiere) pero el receipt lo reporta como archivo | **HALLAZGO menor (cosmético)** |
| create_project sobre .prproj abierto | "A project is already open at…; choose a new path" — sin sobreescribir | OK ✓ |

## FAM-6 · Enums inválidos — 4 sondas
enabled "maybe" (pide boolean, OK), track_type "banana", platform "myspace", blend_mode "NORMAL" → fail-closed. **Persistente:** los errores de enum NO listan los valores válidos (igual que r1/r2) — el caller queda a ciegas. **HALLAZGO menor (recurrente).**

## FAM-7 · Conflictos de estado — 8 sondas
| Sonda | Resultado | Clase |
|---|---|---|
| **delete media en uso** | "used by 1 timeline clip(s) in R2T… nothing was deleted… or pass confirm_remove_from_sequences" | **OK ejemplar** |
| **add sobre pista bloqueada** | "Insert refused… tracks must shift but are locked: video track 0… use scope 'target_tracks'" | **OK ejemplar** |
| doble delete secuencia | 2ª → "Sequence not found" (podría decir "already deleted") | OK |
| **rename_clip a ""** | `renamed: true` — clip queda con name:"" (la UI de Premiere no lo permite) | **HALLAZGO** |
| marcadores duplicados mismo t | 2 creados (Premiere apila marcadores legítimamente) | OK |
| move a posición ocupada | sin overlap real (A/V en pistas distintas) | OK |

## FAM-8 · Límites de payload — 4 sondas
batch 33 clips → "must NOT have more than 32 items" (nombra el límite) ✓; markers 250 → "more than 200" ✓; multiple_undo count 0/9999 → "integer from 1 through 100" (¡enumera el rango!) ✓✓. **Clase: OK-honesto (100%) — los mejores mensajes del server.**

## FAM-9 · Inyección / caracteres especiales — 6 sondas
`<script>alert(1)</script>`, comillas, ñ, emoji, `\n`, SQL injection en marker name/comments → readback **verbatim** (datos inertes en el DOM de Premiere, sin ejecución); rename con especiales OK; bin "../../evil" (nombre literal — los bins no son rutas); XML injection en set_metadata → almacenado escapado, readback exacto. **Clase: OK-honesto (100%) — sin superficie de inyección real.**

## FAM-10 · Estado/undo-adjacente — 5 sondas
| Sonda | Resultado | Clase |
|---|---|---|
| **preview_edit_plan con nodo inexistente** | emite operationId+token (valida solo al aplicar) | **HALLAZGO menor** |
| apply con token de plan imposible | rechazado en revalidación ("Clip not found for operation 0") | OK (fail-closed se mantiene) |
| **REPLAY: aplicar → undo → mismo token** | **aplica de nuevo** — los tokens no son de un solo uso | **HALLAZGO** |
| redo con índice erróneo | fail-closed con índice real | OK |
| undo con índice rancio | warning transparente "moved 43 to 41 instead of 42… inspect the project" — los índices de pila no siempre avanzan 1/acción | OK (bien reportado) |

## Resumen
- **72 sondas** en 10 familias: 63 OK-honesto, **9 hallazgos** (0 críticos; 2 medianos: rename vacío y token reutilizable; 7 menores).
- Fortalezas destacadas: FAM-2/4/8 (validación de tipos/IDs/límites con mensajes que nombran causa y rango), conflictos de estado (delete-en-uso y lock con escape hatch documentado), inyección (superficie nula).
- Debilidad transversal: los **errores de enum no listan valores válidos** y el **guard de undo es opcional**.
