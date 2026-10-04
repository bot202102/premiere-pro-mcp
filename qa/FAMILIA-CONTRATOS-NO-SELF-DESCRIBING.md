# PARA EL AGENTE DE REPARACIONES — Invitación a cazar la FAMILIA: "Contratos no self-describing → calibración por tanteo"

> Autor: agente QA (rondas 1–11). Fecha: 2026-10-04.
> Compañero de: `INFORME-MAESTRO-R1-R11.md` (índice de rondas) y `informe-consolidado\` (los 11 reportes completos).
> Artefacto clave citado abajo: `C:\Users\rpach\Videos\stress4\runs\r11-tools-schemas.json` — inputSchemas de las 480 tools, tal como las devuelve `tools/list`.

---

## 0. Por qué te escribo esto (el planteo del usuario, que yo confirmé)

El usuario observó que durante las rondas "estoy calibrando al aire las herramientas, explorando cuántas variables admiten… cosas que intuyo deberían estar listas para usar (MCP), no un constante tanteo de las dimensiones". **Tiene razón, y no es un defecto mío ni de una tool puntual: es una FAMILIA.** Mis 11 reportes documentaron los síntomas tool-por-tool, pero nunca elevé el patrón a hallazgo de primera clase. Ese es el hueco que este documento cierra.

**El costo** (lo que un agente consumidor pagaría en cada sesión nueva): en R11 solamente, la calibración al aire costó **5 intentos fallidos** en `plan_transcript_rough_cut_uxp`, **4** en `build_caption_artifact`, **4** en reconexión post-lease, más cascadas de prueba-y-error en remove de efectos y parámetros de audio. Multiplicado por cada agente nuevo y cada sesión: un gasto repetible que un buen contrato de error eliminaría de un plumazo.

## 1. Definición de la familia

**Una tool está "self-describing" cuando, al fallar, su error TE ENSEÑA el contrato correcto** (valores válidos, nombres de campo esperados, semántica) — o cuando la documentación machine-readable la describe completa sin tanteo. El server MCP **SÍ genera inputSchemas completas** (lo pruebo: están todas en `r11-tools-schemas.json`), pero en la práctica:

1. Los **errores de validación no citan el schema** — dicen "inválido" sin decir qué se esperaba.
2. Parte de la **semántica real vive fuera del schema** (normalizaciones, side-effects, cachés, requerimientos encadenados) y solo se descubre probando.
3. Algunos **enums no están listados** ni en schema ni en error (#725).

Resultado: el agente tantea. Cada tanteo es una llamada + respuesta de error + razonamiento = tokens. **Tú ya arreglaste instancias sueltas de esta familia; esta invitación es para que la caces SISTEMÁTICAMENTE.**

## 2. Sub-familias con instancias concretas (todas con evidencia en rondas)

### F-A — Errores que no enseñan el contrato (la sub-familia madre)
| Instancia | Lo que pasó | Lo que el error DEBÍA decir | Ronda |
|---|---|---|---|
| `plan_transcript_rough_cut_uxp` placements | 5 intentos: rechazó `sequence_id`, luego exigió `timeline_end_seconds` | "placements requiere {track, source…, timeline_end_seconds}; sequence_id no aplica aquí" | R11 |
| `build_caption_artifact` word_timeline | 4 intentos: exactamente `source_project_item_id` + `transcript_revision` + `words[{text,start_seconds,end_seconds}]` | el schema exacto de words y las 3 claves requeridas | R11 |
| `transcribe_clip_uxp` | exigía `confirm_destructive` sin decirlo hasta el intento N | "requiere confirm_destructive:true (reemplaza audio del clip)" | R7, R11 |
| Casos R1: `paths`→`file_paths`, `name`→`sequence_id`, `frame_size_*`→`width/height`, marker color string→number, `template_name`→`template`, metadata `parse_fields` boolean, ducking `duck_amount_db`→`ducked_db` | cada uno = 1+ llamada fallida | "campo desconocido 'paths'; esperado: file_paths (array de rutas)" — y hoy `set_metadata` SÍ devuelve nombres cualificados en su error: **ese es el estándar a extender** | R1 (fixes ya en build actual) |

### F-B — Enums invisibles (#725, parcialmente vivo)
- `plan_transcript` op enum no listado (R10–R11); acción `inspect`/`apply` de ripple (R8); colores de marker (R1).
- **Mejora verificada**: en -4+ varios enums empezaron a listarse en errores. Quedan instancias: cada error de enum debería incluir la lista completa de valores válidos.

### F-C — Semántica oculta fuera del schema (la más costosa: NO se descubre ni tanteando el nombre del campo)
| Semántica oculta | Costo de descubrirla | Ronda |
|---|---|---|
| Audio: `0.5 = 0 dB` (normalización interna) | receipt no lo dice; se dedujo midiendo ffprobe | R8–R11 |
| Params time-varying: `set_value` rechaza con "Use add_keyframe" | el error apunta bien (bien hecho), pero el schema/inspect podría declararlo a priori | R8, R10 |
| `capture_frame` cachea por `time_seconds` | dos capturas al mismo tiempo devuelven el MISMO frame aunque el clip cambió — invalidó un driver entero antes de detectarlo | R8, R10 |
| `remove` de efectos: exige `component_index` + GUID real; los índices bailan entre inspecciones | limpieza descendente requiere re-inspección entre pasadas | R8, R9, R11 |
| `renderHonesty` en receipt de `set_interpolation` | admite que el render NO honra interpolación (hold-snap) — honesto pero escondido en un campo que nadie conoce | R10–R11 |

### F-D — Descubrimiento de estructura por tanteo
- Catálogo de efectos en arrays paralelos `matchNames[]`/`displayNames[]` (audio SOLO en es-ES) — el driver R8 lo confundió hasta zipearlos.
- `remove_selection`/`ripple` exigen `expected_snapshot` cuya forma hay que adivinar (R8).
- `manage_media_health` no registrada de forma determinística (R10).

## 3. Qué te pido (la caza, concretamente)

1. **Auditar la generación de errores de validación en un solo lugar** (capa común de schema-validation del server): que TODO error incluya: campo rechazado → valores válidos o schema del campo (como ya hace `set_metadata` con nombres cualificados). Un cambio en esa capa cubre las 480 tools de golpe — es la palanca más barata.
2. **Completar los enums faltantes** (#725 cerrable de verdad): grep de errores tipo "must be one of" vs "invalid value" sin lista.
3. **Declarar la semántica oculta en el schema o en `description`**: normalización de audio (0.5=0dB), params time-varying (set_value→auto-keyframe o error con alternativa, ya lo hace), caché de capture_frame (o claves de caché incluye el estado del clip), requerimiento de GUID real para remove.
4. **Machine-readable de una vez**: las inputSchemas ya existen (`r11-tools-schemas.json`) — agregar por tool un bloque `contract` (semántica + ejemplos válidos) servido por el propio server (p.ej. vía `get_uxp_capabilities` extendido o un tool `describe_tool`), para que un agente nuevo LEA en vez de TANTEAR.
5. **Criterio de caza por familia**: cada bug que encuentres, pregúntate "¿es una instancia de F-A/B/C/D o es único?" — y si es instancia, apunta el fix a la capa común, no al caso suelto. Eso es lo que evitó #718–#722/#725: fixes uno-a-uno donde la familia seguía viva.

## 4. No está roto todo (para calibrar tu expectativa)

Ya verifiqué mejoras que van en la dirección correcta y conviene preservarlas como patrón: enums listados en errores (-4+), `renderHonesty`, `undoRecordable`, el error de `set_metadata` con nombres cualificados, el guard #772, "Use add_keyframe" que apunta a la solución. **El estándar ya existe dentro del propio código — la familia se cierra generalizándolo, no inventando nada nuevo.**

— Fin. Si algo de arriba no reproduce, los colas y receipts crudos están en `runs/r1-*` … `runs/r11-*` de cada carpeta de stress (índice en el maestro).
