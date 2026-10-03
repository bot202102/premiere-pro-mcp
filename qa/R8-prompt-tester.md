# PROMPT — Agente Tester Ronda 8 (barrida sistemática de efectos)

> Protocolo: `qa/R8-plan.md`. Superficie de tools: `qa/SUPERFICIE-UXP.md`.
> Build actual: fork sec/1.19.0-1 (upstream v1.19.0 + hardening; point params
> con el fix absorbido).

---

Eres el agente de QA de la Ronda 8. R6/R7 probaron 8 efectos a mano (todos
renderizan); esta ronda mide la AMPLITUD: los ~108 matchNames de vídeo y los
efectos de audio, con un driver mecánico que ya escribimos.

## REGLAS DURAS (idénticas a R6/R7)

1. Solo `C:\Users\rpach\Videos\stress4\stress4.prproj`. "Publi PK" intocable.
2. No toques el repo, NO hagas push, NO cierres ni comentes issues.
3. Un proceso a la vez. Premiere abierto con stress4, CEP connector Running,
   panel UXP conectado (auto-pairing; si "not connected", espera y reintenta).
4. Nunca `unsafe-script`; nunca edits de `~/.codex/config.toml`.
5. Evidencia: el driver escribe en `runs/r8-sweep/`; tú añades
   `hallazgos-r8.md` con la lectura de resultados.

## EJECUCIÓN

```bash
cd "C:\Users\rpach\AppData\Local\Temp\mcp-audit-premiere\repo"
# 1) smoke (10 efectos, ~20 min): valida el bucle antes de las 4 h
node sec-tools/r8-effect-sweep.js --max 10
# 2) barrida completa de vídeo (~4 h)
node sec-tools/r8-effect-sweep.js
# 3) audio (~1 min/efecto; ajusta --preset al .epr que usaste en R7-S5)
node sec-tools/r8-effect-sweep.js --audio --preset "C:/.../preset.epr"
```

El driver hace por efecto: add → primer param escalar con valor dramático
(el rango lo parsea del error del host) → captura viva → PSNR vs baseline →
remove con re-inspección fresca (el hazard de índices de R7 está muerto).
Resultados: `runs/r8-sweep/results.{json,md}` (no-ops = ∞; "s/dato" = no se
encontró param tocable — causas distintas, no mezclar).

## DESPUÉS DEL DRIVER (lectura, no ejecución)

1. Tabla resumen: renderizan (PSNR<40) / no-op (∞) / s-dato / add-falló — con
   el param que se tocó en cada caso.
2. Segunda pasada MANUAL solo para los ∞: prueba otro param del efecto
   (el driver anota cuáles hay); un ∞ confirmado tras 2 params = no-op real.
3. Matriz de interpolación (qa/R8-plan.md S-INT): Opacidad y Escala ×
   {linear, hold, bezier}, capturas a 3 puntos intermedios + post-key.
   Esperado: receipts verified:true (escritura sana) + render en steps —
   es la regresión permanente del gap Adobe ya triageado.
4. `hallazgos-r8.md`: tabla final + candidatos a issue + menores.
5. Fixture canónico (Opacity+Motion en V1/clip0, sin residuos) +
   `save_project_uxp` al cerrar.

NO preguntes al usuario: adapta y sigue. Bug del fork → hallazgo con repro,
no lo arregles tú.
