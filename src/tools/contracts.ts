/**
 * SEC FORK (FAMILIA-CONTRATOS-NO-SELF-DESCRIBING, invitación del QA R1-R11):
 * los errores de validación y las inputSchemas existen, pero parte de la
 * semántica real (normalizaciones, cachés, requerimientos encadenados, nombres
 * localizados) vive FUERA del schema y solo se descubre tanteando. Este mapa
 * curado hace self-describing a la tool: cada entrada documenta el contrato
 * aprendido en QA con evidencia, servido por `describe_tool`.
 */
export const TOOL_CONTRACT_NOTES: Record<string, string[]> = {
  // --- Audio (F-C: semántica oculta más costosa) ---
  set_clip_volume: [
    "Hosts es-ES: el componente interno se llama 'Volumen'/'Nivel' — la tool resuelve nombres localizados (Internal Volume Mono|Stereo|5.1).",
  ],
  set_clips_volume: [
    "Bulk: misma resolución localizada que set_clip_volume.",
  ],
  set_clip_pan: ["API de pan inexistente en ExtendScript/UXP (#265): workaround Channel Volume L/R."],
  automate_effect_parameters_uxp: [
    "Audio: valores NORMALIZADOS (0.5 = 0 dB; el rango depende del efecto — leído del error 'from X to Y' del host).",
    "Parámetros time-varying: set_value NO aplica — usar add_keyframe (time_seconds requerido). El inspect declara timeVarying.",
    "remove exige component_index + expected_effect_id REAL (los índices bailan entre inspecciones: re-inspecciona entre pasadas).",
    "Nombres de efecto/propiedad LOCALIZADOS en hosts es-ES (p.ej. 'Opacidad', 'Asociar negro a').",
    "inspect_point_value/color_value solo aplican a params PointF/Color (los escalares fallan con UXP_PARAMETER_NOT_POINT); Premiere devuelve puntos como [x,y] y el panel normaliza a {x,y}.",
  ],
  add_keyframe: [
    "effect_name y property_name son LOCALIZADOS del host (es-ES: 'Opacidad'/'Opacidad').",
    "node_id = nodeId del CLIP DE TIMELINE (get_clip_at_position), no del project item.",
  ],
  set_keyframe_interpolation: [
    "Honestidad de render (medida en 26.5.2): el modo se almacena y verifica en readback, pero el render NO honra curvas temporales — valores entre pasos en todos los modos (linear/bezier/hold). Verifica cualquier curva de tiempo por render.",
  ],
  capture_frame: [
    "CACHE por time_seconds: dos capturas al mismo tiempo devuelven el MISMO frame aunque el clip cambie — usa claves de tiempo distintas (lección R8/R10: invalidó un driver entero).",
  ],
  remove_all_effects: [
    "En hosts es-ES el guard de built-ins localizados (#674) protege componentes como 'Volumen' — las limpiezas quirúrgicas van por manage_clip_effects_uxp remove.",
  ],
  // --- Edición / estructura (F-D) ---
  add_keyframe: [...[]].concat([
    "Los nodeId de clip de timeline CAMBIAN entre sesiones — nunca los hardcodees; re-resuelve con get_clip_at_position.",
  ]),
  add_to_timeline: ["item_id = nodeId del project item (find_project_item_by_name)."],
  edit_timeline_uxp: [
    "action insert exige audio_track_index TAMBIÉN para clips solo-vídeo.",
    "project_item_id = GUID estable UXP (del receipt del primer insert; el nodeId CEP NO sirve).",
  ],
  plan_transcript_rough_cut_uxp: [
    "placements NO lleva sequence_id: {placement_id, track_type, track_index, source_in/out, timeline_start/end, timeline_end_seconds}.",
    "Requiere transcript_revision del get_clip_transcript_uxp.",
  ],
  build_caption_artifact: [
    "word_timeline exige exactamente {source_project_item_id, transcript_revision, words[{text,start_seconds,end_seconds}]}.",
  ],
  transcribe_clip_uxp: [
    "Requiere confirm_destructive:true (reemplaza el audio del clip) + operation_id para replay seguro.",
  ],
  set_interpolation: [
    "renderHonesty: el modo se almacena y verifica, pero el render de 26.5.2 NO honra curvas temporales (medido CEP+UXP, #771).",
  ],
  set_metadata: [
    "Campos cualificados (Column.PropertyText.X) — su error ya enseña el nombre cualificado: ESE es el estándar de error self-describing del fork.",
  ],
  add_marker: [
    "Los markers NO son undoables por scripting (#733): el receipt declara undoRecordable:false. Limpieza = delete explícito.",
  ],
  // --- Rendimiento/operación ---
  list_clip_effects: ["UXP sesión persistente ≈0.46 s/llamada vs CEP spawn 1.88 s — barridas grandes siempre con session-run."],
  get_render_queue_status: ["El auto-start del batch es fork-only en add_to_render_queue (26.5.2 nunca procesa la cola sola); los encode secundarios son opt-in."],
};

/** Notas globales aplicables a cualquier tool. */
export const GLOBAL_CONTRACT_NOTES: string[] = [
  "Nombres de efectos/propiedades/componentes son LOCALIZADOS del host (es-ES: 'Opacidad', 'Volumen'); los matchNames AE.ADBE.* no cambian de idioma.",
  "Dos tipos de id: nodeId CEP (por-sesión, para tools ExtendScript) vs GUID/GUID estable UXP (persistente, para tools *_uxp). No son intercambiables.",
  "El perfil default no incluye unsafe-script (nunca activarlo).",
];
