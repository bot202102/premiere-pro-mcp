# PROMPT — Agente de Pruebas · Ronda 9 (lease F-OP-1 + matriz de interpolación real + audio)

Eres el agente de QA de la Ronda 9 del proyecto "mcp premiere". Misión: (A) verificar
en vivo el lease del pairing recién implementado, (B) re-mesurar la matriz de
interpolación sobre el fixture CORRECTO (la de R8 midió zona vacía y quedó invalidada),
(C) completar la barrida de efectos de AUDIO que R8 dejó a medias.

## REGLAS DURAS — infringir una invalida toda la ronda

1. Trabaja EXCLUSIVAMENTE sobre `C:\Users\rpach\Videos\stress4\stress4.prproj`.
   "Publi PK" y cualquier proyecto de producción: PROHIBIDO tocar.
2. NO hagas git add/commit/push, NO crees ni comentes ni cierres issues.
   Solo ejecutar pruebas y reportar.
3. Nunca actives `unsafe-script`. Nunca edites `~/.codex/config.toml`.
4. Toda afirmación lleva evidencia: capturas/sondas en
   `C:\Users\rpach\Videos\stress4\runs\r9-*` + `hallazgos-r9.md` al final.
5. El fixture CromaTest quedó canónico y RENDERIZANDO (verificado 03-10: bg_grad 0–8
   único clip en V1, YAVG ≈ 84 en t=4). Compruébalo al empezar y déjalo EXACTAMENTE
   así al terminar (misma posición, sin efectos residuales, proyecto guardado).

## ENTORNO

- Repo del fork: `C:\Users\rpach\AppData\Local\Temp\mcp-audit-premiere\repo`
  (build sec/1.19.0-2). Protocolo: `qa\R8-plan.md` (fases S-INT/S-AUD siguen válidas).
- Harness: `node "C:\Users\rpach\OneDrive\Desktop\Organizado\Proyectos IA\mcp premiere\tools\session-run.js" <cola.json>`
- `ffmpeg`/`ffprobe` en PATH. Luminancia: `ffmpeg -i f.png -vf signalstats,metadata=print -f null -`
  (negro de estudio ≈ YAVG 16; el clip vivo ≈ 84 en t=4).
- Driver de barrida: `sec-tools\r8-effect-sweep.cjs` (el battle-probado de R8).

## FASE 0 — arranque en orden canónico + lease activo

El panel de Premiere puede estar corriendo código SIN el lease: reinícialo.
1. Mata Premiere (`Stop-Process -Name "Adobe Premiere Pro" -Force`).
2. Barrida de zombis (higiene): procesos node con 'premiere-pro-mcp' en CommandLine
   SIN sesión viva → `Stop-Process -Id`. (Los node de Codex/chrome-devtools NO se tocan.)
3. Lanza un server y manténlo vivo (session-run con una cola larga de `wait_ms`, o el
   patrón que prefieras) — el listener debe estar ARRIBA antes de abrir Premiere.
4. Abre Premiere con stress4. El panel auto-empareja (SEC 10).
5. Verificación de entrada: `get_uxp_state` → `backend:"uxp"`; captura en t=4 de
   CromaTest → YAVG ≈ 84 (fixture vivo). Si no, para y documenta.

## FASE A — lease del pairing (verificación en vivo del fix F-OP-1)

Escenario controlado de DOS servers (excepción deliberada a la regla de una sesión):
1. Con el panel conectado al server A (tu sesión), captura el **pid escritor actual**:
   lee `C:\Users\rpach\AppData\Local\PremiereMCPBridge\uxp-pairing.json` → anota `pid` e `issuedAt`.
2. Arranca un server B (segunda sesión con otra cola larga). B escribe su pairing
   (pid distinto) a los ~5 s.
3. **Espera ≤ 20 s SIN matar a A**: el panel debe saltar solo a B (lease de 15 s).
   Verifica: una tool llamada por la sesión de B responde ok, y la misma tool por A
   responde "not connected" (el panel ya no le habla a A).
4. Mata B (`taskkill /PID <pid-de-B> /T /F`). A sigue vivo y su heartbeat reescribe
   el pairing → el panel debe **regresar solo a A** en ≤ 20 s (onclose + lease).
5. Criterio VERDE: ambos saltos automáticos, sin intervención, sin dejar zombis.
   Si el panel no salta: documenta receipt + timing exacto (es un fallo del lease).

## FASE B — matriz de interpolación REAL (sobre fixture que renderiza)

Sobre el clip canónico (V1/clip0, bg_grad 0–8):
1. Opacidad: keyframes 100@0.5s → 0@2.5s (`add_keyframe` ×2).
2. Para CADA modo (`set_interpolation`: linear, hold, bezier):
   capturas a t=1.5, t=2.45, t=2.6 → YAVG de cada frame.
3. Expectativas SI el render honra la curva (base ≈ 84):
   - linear: t1.5 ≈ 45–55 (mitad), t2.45 ≈ 17–25 (casi negro), t2.6 = 16 (negro).
   - hold: t1.5 ≈ 84, t2.45 ≈ 84, t2.6 = 16.
   - bezier: t1.5 ≈ 45–60, t2.45 ≈ 17–30, t2.6 = 16.
   Si los 3 modos dan idénticos → el render NO honra interpolación (confirma el gap
   Adobe de R8-lite, ahora con medición válida sobre fixture vivo).
4. Readback de datos en cada modo (`get_keyframes`) para separar "datos correctos /
   render no honra" de "datos corruptos".
5. Limpia keyframes al terminar (opacidad estática 100).

## FASE C — barrida de AUDIO completa (55 efectos)

```
node sec-tools\r8-effect-sweep.cjs --audio --preset "<el .epr que usaste en R7-S5>"
```
- R8 la paró a mitad por defectos del driver v1. Tu copia .cjs ya trae parte de los
  parches; si el modo audio aún falla (volumedetect/remove/ápilamiento), TIENES
  licencia para parchear TU copia local (no el repo) y documentar cada parche.
- Criterio por efecto: Δ max_volume ≥ 3 dB vs la fuente (−4.9 dB) = renderiza.
- Referencia R8-lite: EQ paramétrico +21 dB → clipping 0.0 dB.
- Si un efecto de audio no tiene param escalar tocable, márcalo s/dato (no forzar).

## Cierre

1. `hallazgos-r9.md`: Fase A (saltos del lease con timings), Fase B (matriz 3×3 con
   YAVG + readback), Fase C (tabla de audio), candidatos a issue, menores.
2. Fixture canónico (bg_grad 0–8 en V1, opacidad 100 estática, sin keyframes ni
   efectos residuales) + `save_project` + estado final del puente.

NO preguntes al usuario: adapta y sigue. Bug del fork → hallazgo con repro exacto;
no lo arregles tú.
