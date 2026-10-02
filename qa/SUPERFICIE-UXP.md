# SUPERFICIE UXP — mapa real verificado en vivo (Ronda 6, Fase 0+1)

> Fuente: `runs\r6-tools-full.json` (480 tools con schemas, capturado en vivo),
> `runs\r6-uxp-surface.json` (subconjunto UXP procesado), sondas `runs\r6-*.json`
> del 02-10. Premiere 26.5.2, proyecto stress4, backend verificado `uxp`.

## 1. Cómo funciona esta ruta

- El server registra **solo los comandos que el panel UXP implementa** — nunca
  reenvía un fallo UXP por CEP (diseño upstream). Nomenclatura MCP:
  `comando.punto.del.panel` → `snake_case_uxp` (ej.: `timeline.insert` → `edit_timeline_uxp`).
- **92 tools `*_uxp`** sobre 480 totales del perfil completo. Los otros ~388 son
  ruta CEP (ExtendScript) — ver ESTADO-MAESTRO §5 para qué funciona allí.
- Conexión: **auto-pairing SEC 10** — el server escribe `uxp-pairing.json` y el
  panel lo lee y conecta solo, incluido saltar a un server nuevo en ~2-4 s
  (self-healing verificado: 7777→62497→60551→51055→52105→54488… cada hop automático).
- Protocolo panel↔server: v2, receipts con `revision` incremental del estado del host,
  GUIDs estables por proyecto/secuencia/clip/marker (no nodeIds CEP).

## 2. Receipts observados en vivo (contrato del tester)

| Tool | Receipt verificado |
|---|---|
| `get_uxp_state` | `{backend:"uxp", result:{revision, projectOpen, project{guid,name,path}, sequenceOpen, sequence{name}, playheadSeconds}}` |
| `inspect_project_uxp` | `revision:"uxp-39db67c2"`, project GUID, `sequences[]` con GUID+name, activeSequenceGuid |
| `inspect_sequence_structure_uxp` | `trackCounts{video:3,audio:4}`, items con `name/startSeconds/endSeconds/inSeconds/outSeconds`, `emptyTracksOmitted:5`, `maxItems:128` |
| `inspect_sequence_timing_uxp` | timeDisplayFormats, projectItem GUID, `verificationBoundary:"sequence_timing_readback"` |
| `list_markers_uxp` | `{scope, ownerGuid, count, markers[{guid,name,comments,type,colorIndex,startSeconds,durationSeconds}]}` |
| `open_project` (CEP) | `{opened, verified, alreadyOpen, activatedVia, activeSequence, openProjects[]}` |

**Errores honestos verificados**: `open_project` con arg desconocido → lista los args
válidos (`path`, no `project_path`); tools UXP sin proyecto → `No active project`;
sin panel → `Premiere UXP bridge is not connected`.

## 3. Familias UXP disponibles (92 tools — nombre MCP → args clave)

Del procesado completo en `runs\r6-uxp-surface.json`. Familias para el tester:

- **Inspección**: `inspect_project_uxp`, `inspect_project_tree_uxp`, `inspect_sequence_structure_uxp`,
  `inspect_sequence_timing_uxp`, `inspect_sequence_timing_by_guid_uxp`, `inspect_frame_alignment_uxp`,
  `inspect_project_selection_uxp`, `inspect_caption_tracks_uxp`, `inspect_effect_parameter_catalog_uxp`,
  `inspect_track_item_identity_uxp`, `inspect_source_media_provenance_uxp`, `inspect_source_proxy_uxp`,
  `inspect_premiere_environment_uxp`, `inspect_premiere_events_uxp`, `inspect_installed_mogrt_directory_uxp`,
  `get_uxp_state`, `get_uxp_capabilities`, `get_uxp_workspace_access`, `get_advanced_feature_support`
- **Edición nativa** (la pregunta #730: ¿tail-teleport en ruta nativa?): `edit_timeline_uxp`,
  `make_split_edit_uxp`, `duplicate_track_item_uxp`, `ripple_delete_track_item_uxp`,
  `slip_track_item_uxp`, `slide_track_item_uxp`, `transform_track_item_uxp`,
  `lift_selection_uxp`, `manage_timeline_selection_uxp`, `batch_selected_clips_uxp`
- **Secuencias/rango/playhead**: `manage_sequences_uxp`, `create_sequence_with_preset_uxp`,
  `create_empty_sequence_uxp`, `manage_sequence_range_uxp`, `manage_work_area_uxp`,
  `manage_sequence_playhead_uxp`, `manage_sequence_settings_uxp`, `manage_sequence_display_format_uxp`,
  `manage_sequence_preview_frame_uxp`, `save_project_uxp`
- **Efectos/parámetros nativos** (puerta alternativa a #735): `manage_clip_effects_uxp`,
  `automate_effect_parameters_uxp`, `manage_color_conformance_uxp`, `compute_mask_fit_motion` (CEP),
  `detect_object_masks_uxp`, `audit_object_masks_uxp`
- **Transiciones de vídeo** (imposibles por CEP): `list_video_transitions_uxp`,
  `inspect_video_transition_uxp`, `add_video_transition_uxp`, `remove_video_transition_uxp`
- **Export/interchange**: `export_frame_uxp`, `export_aaf_uxp`, `export_interchange_uxp`,
  `configure_encoder_uxp`, `encode_media_uxp`, `create_subclip_uxp`
- **Markers**: `manage_markers_uxp`, `apply_beat_markers_uxp`, `list_markers_uxp`
- **Media/ingest**: `import_project_media_uxp`, `manage_growing_media_uxp`, `manage_media_health_uxp`,
  `maintain_media_health_uxp`, `relink_offline_media_uxp`, `manage_proxy_ingest_uxp`,
  `manage_source_media_timing_uxp`, `manage_source_media_overrides_uxp`, `manage_source_clip_uxp`,
  `manage_track_state_uxp`, `manage_timeline_source_label_uxp`, `calculate_tick_time_uxp`
- **Metadata**: `manage_metadata_uxp`, `manage_project_panel_metadata_uxp`, `inspect_project_panel_metadata_uxp`,
  `create_project_metadata_field_uxp`, `organize_project_items_uxp`
- **Transcripts** (25.6+/26.3+): `get_transcript_languages_uxp`, `transcribe_clip_uxp`,
  `is_language_pack_available_uxp`, `has_transcript_uxp`, `get_clip_transcript_uxp`,
  `import_transcript_uxp`, `search_clip_transcript_uxp`, `preview_transcript_edit_uxp`,
  `plan_transcript_rough_cut_uxp`
- **Sesiones/workflow**: `manage_project_sessions_uxp`, `manage_workflow_checkpoints_uxp`,
  `manage_app_preferences_uxp`, `preflight_production_storage_uxp`, `audit_timeline_health` (CEP),
  `detect_scene_edits_uxp`, `create_silence_cut_source_stringout_uxp`, `preview_derived_dialogue_sequence_uxp`,
  `apply_derived_dialogue_sequence_uxp` (con `confirmation_token` — el patrón de tokens existe TAMBIÉN en UXP)

## 4. Hallazgos operativos de la sesión (nuevas trampas → ESTADO-MAESTRO)

14. **Cache de panel UXP**: Premiere copia el plugin a `%APPDATA%\Adobe\UXP\Plugins\External\<id>_<versión>\`
    y sirve EL CACHE, no el side-load — actualizar `%LOCALAPPDATA%\...\extensions\` no basta:
    sincronizar también la copia cacheada (o bump de versión para instalación limpia).
15. **Servers zombi con `shell:true`**: `child.kill()` mata el cmd.exe pero no el node;
    usar tree-kill (`taskkill /pid X /T /F` con **spawnSync** — el spawn asíncrono pierde
    la carrera contra `process.exit`). Un server muerto-mal deja el panel pegado a él
    (conexión ESTABLISHED = no hay onclose = no re-lee pairing).
16. **El panel sigue SIEMPRE el pairing más nuevo**: si un server vivo tiene el panel
    conectado, ignora ficheros nuevos. Regla del tester: UNA sesión viva a la vez.
17. `open_project` usa arg `path` (no `project_path`). Lanzar Premiere SIN arg de
    proyecto y abrirlo vía MCP evita diálogos de "ruta no existe" y carreras de boot.

## 5. Estado de la sesión al cierre

- Premiere abierto (proyecto stress4 activo, secuencia CromaTest), panel UXP conectado
  vía auto-pairing, sin zombis (killTree con spawnSync verificado).
- Schemas completos de los 480 tools guardados para generar las colas del tester.
