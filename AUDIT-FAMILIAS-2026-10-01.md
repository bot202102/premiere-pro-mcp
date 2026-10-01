# Auditoría de dependencias por familias — 2026-10-01

Grafo auditado: **213 paquetes únicos** (11 runtime / 202 dev). Paquetes con scripts de instalación en disco: ninguno.

## Resumen global

- Deprecadas: `eslint@9.39.5` — true
- Errores de consulta: `@adobe/premierepro-beta`
- Con scripts de ciclo de vida: ninguno

### Las 8 versiones más jóvenes del grafo (definen el `minimumReleaseAge` viable)

| Paquete | Versión | Capa | Publicada | Edad (días) |
|---|---|---|---|---|
| @typescript-eslint/parser | 8.70.1 | dev | 2026-09-21 | 10 |
| @typescript-eslint/project-service | 8.70.1 | dev | 2026-09-21 | 10 |
| @typescript-eslint/scope-manager | 8.70.1 | dev | 2026-09-21 | 10 |
| @typescript-eslint/tsconfig-utils | 8.70.1 | dev | 2026-09-21 | 10 |
| @typescript-eslint/types | 8.70.1 | dev | 2026-09-21 | 10 |
| @typescript-eslint/typescript-estree | 8.70.1 | dev | 2026-09-21 | 10 |
| @typescript-eslint/visitor-keys | 8.70.1 | dev | 2026-09-21 | 10 |
| @posthog/core | 1.55.1 | runtime | 2026-09-21 | 10 |

## Familia: Adobe (4)

Detrás de latest: 2. Edad mín/máx: 110/1078 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @adobe/cc-ext-uxp-types | 7.3.1 | dev | 2023-10-19 | 1078 | no | no | ? | — | 32 |
| @adobe/eslint-plugin-premierepro | 26.3.0 | dev | 2026-06-12 | 110 | no | no | Apache-2.0 | 26.5.0 | 32 |
| @adobe/premierepro | 26.3.0 | dev | 2026-06-12 | 110 | no | no | Apache-2.0 | 26.5.0 | 32 |
| @adobe/premierepro-beta | 26.5.0-beta.73 | dev | ? | ? | no | no | ? | — | 0 |

## Familia: Compilación TS (8)

Detrás de latest: 6. Edad mín/máx: 62/959 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @babel/helper-string-parser | 7.29.7 | dev | 2026-05-25 | 129 | no | no | MIT | 8.0.6 | 4 |
| @babel/helper-validator-identifier | 7.29.7 | dev | 2026-05-25 | 129 | no | no | MIT | 8.0.6 | 4 |
| @babel/parser | 7.29.8 | dev | 2026-07-31 | 62 | no | no | MIT | 7.29.9 | 4 |
| @babel/types | 7.29.8 | dev | 2026-07-31 | 62 | no | no | MIT | 8.0.6 | 4 |
| @jridgewell/resolve-uri | 3.1.2 | dev | 2024-02-14 | 959 | no | no | MIT | — | 1 |
| @jridgewell/sourcemap-codec | 1.5.5 | dev | 2025-08-12 | 415 | no | no | MIT | 1.6.0 | 1 |
| @jridgewell/trace-mapping | 0.3.31 | dev | 2025-09-10 | 385 | no | no | MIT | — | 1 |
| typescript | 5.9.3 | dev | 2025-09-30 | 365 | no | no | Apache-2.0 | 7.0.2 | 7 |

## Familia: Lint (71)

Detrás de latest: 45. Edad mín/máx: 10/3722 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @eslint-community/eslint-utils | 4.10.1 | dev | 2026-07-22 | 71 | no | no | MIT | — | 2 |
| @eslint-community/regexpp | 4.12.2 | dev | 2025-10-22 | 344 | no | no | MIT | — | 2 |
| @eslint/config-array | 0.21.2 | dev | 2026-03-06 | 208 | no | no | Apache-2.0 | 0.23.5 | 2 |
| @eslint/config-helpers | 0.4.2 | dev | 2025-10-29 | 337 | no | no | Apache-2.0 | 0.7.0 | 2 |
| @eslint/core | 0.17.0 | dev | 2025-10-29 | 337 | no | no | Apache-2.0 | 1.2.1 | 2 |
| @eslint/eslintrc | 3.3.6 | dev | 2026-07-10 | 82 | no | no | MIT | 3.3.7 | 2 |
| @eslint/js | 9.39.5 | dev | 2026-07-10 | 82 | no | no | MIT | 10.0.1 | 2 |
| @eslint/object-schema | 2.1.7 | dev | 2025-10-17 | 348 | no | no | Apache-2.0 | 3.0.5 | 2 |
| @eslint/plugin-kit | 0.4.1 | dev | 2025-10-29 | 337 | no | no | Apache-2.0 | 0.7.3 | 2 |
| @humanwhocodes/module-importer | 1.0.1 | dev | 2022-08-18 | 1504 | no | no | Apache-2.0 | — | 1 |
| @humanwhocodes/retry | 0.4.3 | dev | 2025-05-07 | 512 | no | no | Apache-2.0 | — | 1 |
| @typescript-eslint/parser | 8.70.1 | dev | 2026-09-21 | 10 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/project-service | 8.70.1 | dev | 2026-09-21 | 10 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/project-service | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/scope-manager | 8.70.1 | dev | 2026-09-21 | 10 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/scope-manager | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/tsconfig-utils | 8.70.1 | dev | 2026-09-21 | 10 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/tsconfig-utils | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/types | 8.70.1 | dev | 2026-09-21 | 10 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/types | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/typescript-estree | 8.70.1 | dev | 2026-09-21 | 10 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/typescript-estree | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/utils | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/visitor-keys | 8.70.1 | dev | 2026-09-21 | 10 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/visitor-keys | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| acorn | 8.18.0 | dev | 2026-07-28 | 65 | no | no | MIT | — | 3 |
| acorn-jsx | 5.3.2 | dev | 2021-07-09 | 1910 | no | no | MIT | — | 3 |
| ansi-styles | 4.3.0 | dev | 2020-10-04 | 2187 | no | no | MIT | 7.0.0 | 1 |
| balanced-match | 1.0.2 | dev | 2021-04-06 | 2004 | no | no | MIT | 4.0.4 | 1 |
| balanced-match | 4.0.4 | dev | 2026-02-22 | 221 | no | no | MIT | — | 1 |
| brace-expansion | 1.1.21 | dev | 2026-09-14 | 16 | no | no | MIT | 5.0.12 | 2 |
| brace-expansion | 5.0.12 | dev | 2026-09-14 | 16 | no | no | MIT | — | 2 |
| chalk | 4.1.2 | dev | 2021-07-30 | 1889 | no | no | MIT | 6.0.1 | 1 |
| color-convert | 2.0.1 | dev | 2019-08-19 | 2599 | no | no | MIT | 3.1.3 | 1 |
| color-name | 1.1.4 | dev | 2018-09-21 | 2932 | no | no | MIT | 2.1.1 | 3 |
| cross-spawn | 7.0.6 | dev | 2024-11-18 | 682 | no | no | MIT | — | 1 |
| debug | 4.4.3 | dev | 2025-09-13 | 383 | no | no | MIT | — | 2 |
| deep-is | 0.1.4 | dev | 2021-09-04 | 1853 | no | no | MIT | — | 1 |
| eslint | 9.39.5 | dev | 2026-07-10 | 82 | ⚠️ | no | MIT | 10.11.0 | 2 |
| eslint-scope | 8.4.0 | dev | 2025-06-09 | 479 | no | no | BSD-2-Clause | 9.1.2 | 2 |
| eslint-visitor-keys | 5.0.1 | dev | 2026-02-20 | 223 | no | no | Apache-2.0 | — | 2 |
| eslint-visitor-keys | 3.4.3 | dev | 2023-08-11 | 1147 | no | no | Apache-2.0 | 5.0.1 | 2 |
| eslint-visitor-keys | 4.2.1 | dev | 2025-06-09 | 479 | no | no | Apache-2.0 | 5.0.1 | 2 |
| espree | 10.4.0 | dev | 2025-06-09 | 479 | no | no | BSD-2-Clause | 11.2.0 | 2 |
| esquery | 1.7.0 | dev | 2025-12-31 | 274 | no | no | BSD-3-Clause | — | 2 |
| esrecurse | 4.3.0 | dev | 2020-08-31 | 2221 | no | no | BSD-2-Clause | — | 3 |
| estraverse | 5.3.0 | dev | 2021-10-25 | 1802 | no | no | BSD-2-Clause | — | 3 |
| esutils | 2.0.3 | dev | 2019-07-31 | 2619 | no | no | BSD-2-Clause | — | 2 |
| fast-levenshtein | 2.0.6 | dev | 2016-12-27 | 3564 | no | no | MIT | 3.0.0 | 1 |
| find-up | 5.0.0 | dev | 2020-08-11 | 2241 | no | no | MIT | 8.0.0 | 1 |
| has-flag | 4.0.0 | dev | 2019-04-06 | 2735 | no | no | MIT | 5.0.1 | 1 |
| isexe | 2.0.0 | dev | 2017-03-23 | 3479 | no | no | ISC | 4.0.0 | 1 |
| levn | 0.4.1 | dev | 2020-04-04 | 2371 | no | no | MIT | — | 1 |
| locate-path | 6.0.0 | dev | 2020-08-10 | 2242 | no | no | MIT | 8.0.0 | 1 |
| minimatch | 3.1.5 | dev | 2026-02-25 | 218 | no | no | ISC | 10.2.6 | 1 |
| minimatch | 10.2.6 | dev | 2026-07-27 | 65 | no | no | BlueOak-1.0.0 | — | 1 |
| ms | 2.1.3 | dev | 2020-12-08 | 2123 | no | no | MIT | — | 6 |
| natural-compare | 1.4.0 | dev | 2016-07-22 | 3722 | no | no | MIT | — | 1 |
| optionator | 0.9.4 | dev | 2024-04-26 | 887 | no | no | MIT | — | 1 |
| p-limit | 3.1.0 | dev | 2020-11-25 | 2136 | no | no | MIT | 7.3.3 | 1 |
| p-locate | 5.0.0 | dev | 2020-08-10 | 2242 | no | no | MIT | 7.0.0 | 1 |
| path-key | 3.1.1 | dev | 2019-11-22 | 2505 | no | no | MIT | 4.0.0 | 1 |
| prelude-ls | 1.2.1 | dev | 2020-04-02 | 2372 | no | no | MIT | — | 1 |
| shebang-command | 2.0.0 | dev | 2019-09-06 | 2582 | no | no | MIT | — | 1 |
| shebang-regex | 3.0.0 | dev | 2019-04-27 | 2714 | no | no | MIT | 4.0.0 | 1 |
| supports-color | 7.2.0 | dev | 2020-08-28 | 2225 | no | no | MIT | 11.0.0 | 1 |
| ts-api-utils | 2.5.0 | dev | 2026-03-19 | 196 | no | no | MIT | — | 1 |
| type-check | 0.4.0 | dev | 2020-04-03 | 2372 | no | no | MIT | — | 1 |
| which | 2.0.2 | dev | 2019-11-18 | 2508 | no | no | ISC | 7.0.0 | 4 |
| word-wrap | 1.2.5 | dev | 2023-07-22 | 1167 | no | no | MIT | — | 2 |
| yocto-queue | 0.1.0 | dev | 2020-11-24 | 2137 | no | no | MIT | 1.2.2 | 1 |

## Familia: MCP core (4)

Detrás de latest: 4. Edad mín/máx: 65/65 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @modelcontextprotocol/client | 2.0.0 | dev | 2026-07-27 | 65 | no | no | MIT | 2.2.0 | 5 |
| @modelcontextprotocol/core | 2.0.0 | **runtime** | 2026-07-27 | 65 | no | no | MIT | 2.2.0 | 5 |
| @modelcontextprotocol/node | 2.0.0 | **runtime** | 2026-07-27 | 65 | no | no | MIT | 2.1.0 | 5 |
| @modelcontextprotocol/server | 2.0.0 | **runtime** | 2026-07-27 | 65 | no | no | MIT | 2.2.0 | 6 |

## Familia: Otras (transitivas) (76)

Detrás de latest: 38. Edad mín/máx: 35/5094 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @bcoe/v8-coverage | 1.0.2 | dev | 2025-01-15 | 624 | no | no | MIT | — | 1 |
| @humanfs/core | 0.19.2 | dev | 2026-04-17 | 166 | no | no | Apache-2.0 | 0.20.0 | 1 |
| @humanfs/node | 0.16.8 | dev | 2026-04-17 | 166 | no | no | Apache-2.0 | 0.17.0 | 1 |
| @humanfs/types | 0.15.0 | dev | 2024-09-09 | 751 | no | no | Apache-2.0 | 0.16.0 | 1 |
| ajv | 6.15.0 | dev | 2026-04-23 | 161 | no | no | MIT | 8.20.0 | 2 |
| argparse | 2.0.1 | dev | 2020-08-28 | 2224 | no | no | Python-2.0 | 3.0.2 | 1 |
| assertion-error | 2.0.1 | dev | 2023-10-18 | 1078 | no | no | MIT | — | 1 |
| ast-v8-to-istanbul | 1.0.5 | dev | 2026-07-14 | 79 | no | no | MIT | 1.0.7 | 1 |
| callsites | 3.1.0 | dev | 2019-04-06 | 2735 | no | no | MIT | 4.2.0 | 1 |
| chai | 6.2.2 | dev | 2025-12-22 | 282 | no | no | MIT | 6.3.0 | 1 |
| concat-map | 0.0.1 | dev | 2014-01-30 | 4627 | no | no | MIT | 0.0.2 | 1 |
| convert-source-map | 2.0.0 | dev | 2022-10-17 | 1444 | no | no | MIT | — | 2 |
| detect-libc | 2.1.2 | dev | 2025-10-05 | 361 | no | no | Apache-2.0 | — | 1 |
| es-module-lexer | 2.3.1 | dev | 2026-07-12 | 81 | no | no | MIT | 3.0.2 | 1 |
| escape-string-regexp | 4.0.0 | dev | 2020-04-23 | 2352 | no | no | MIT | 5.0.0 | 1 |
| estree-walker | 3.0.3 | dev | 2023-01-20 | 1350 | no | no | MIT | — | 1 |
| eventsource | 3.0.7 | dev | 2025-05-09 | 510 | no | no | MIT | 5.1.2 | 2 |
| eventsource-parser | 3.0.6 | dev | 2025-08-29 | 398 | no | no | MIT | 4.1.1 | 1 |
| expect-type | 1.3.0 | dev | 2025-12-08 | 297 | no | no | Apache-2.0 | 1.4.0 | 1 |
| fast-deep-equal | 3.1.3 | dev | 2020-06-08 | 2306 | no | no | MIT | — | 1 |
| fast-json-stable-stringify | 2.1.0 | dev | 2019-12-14 | 2483 | no | no | MIT | — | 1 |
| file-entry-cache | 8.0.0 | dev | 2023-12-18 | 1017 | no | no | MIT | 11.1.5 | 1 |
| flat-cache | 4.0.1 | dev | 2024-03-02 | 943 | no | no | MIT | 6.1.23 | 1 |
| flatted | 3.4.4 | dev | 2026-07-30 | 63 | no | no | ISC | — | 1 |
| fsevents | 2.3.3 | dev | 2023-08-21 | 1137 | no | no | MIT | — | 2 |
| glob-parent | 6.0.2 | dev | 2021-09-29 | 1827 | no | no | ISC | — | 4 |
| globals | 14.0.0 | dev | 2024-02-10 | 964 | no | no | MIT | 17.13.0 | 4 |
| html-escaper | 2.0.2 | dev | 2020-03-27 | 2379 | no | no | MIT | 3.0.3 | 1 |
| ignore | 5.3.2 | dev | 2024-08-12 | 780 | no | no | MIT | 7.0.11 | 1 |
| import-fresh | 3.3.1 | dev | 2025-02-02 | 606 | no | no | MIT | 4.0.1 | 1 |
| imurmurhash | 0.1.4 | dev | 2013-08-24 | 4785 | no | no | MIT | — | 1 |
| is-extglob | 2.1.1 | dev | 2016-12-11 | 3581 | no | no | MIT | — | 2 |
| is-glob | 4.0.3 | dev | 2021-09-29 | 1828 | no | no | MIT | — | 3 |
| istanbul-lib-coverage | 3.2.2 | dev | 2023-11-08 | 1058 | no | no | BSD-3-Clause | — | 4 |
| istanbul-lib-report | 3.0.1 | dev | 2023-07-25 | 1164 | no | no | BSD-3-Clause | — | 4 |
| istanbul-reports | 3.2.0 | dev | 2025-08-18 | 409 | no | no | BSD-3-Clause | — | 5 |
| js-tokens | 10.0.0 | dev | 2025-12-08 | 296 | no | no | MIT | — | 1 |
| js-yaml | 4.3.2 | dev | 2026-08-26 | 35 | no | no | MIT | 5.4.2 | 1 |
| json-buffer | 3.0.1 | dev | 2018-09-10 | 2942 | no | no | MIT | — | 1 |
| json-schema-traverse | 0.4.1 | dev | 2018-06-10 | 3035 | no | no | MIT | 1.0.0 | 1 |
| json-stable-stringify-without-jsonify | 1.0.1 | dev | 2016-12-15 | 3576 | no | no | MIT | — | 1 |
| keyv | 4.5.4 | dev | 2023-10-07 | 1090 | no | no | MIT | 5.6.0 | 2 |
| lightningcss | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-android-arm64 | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-darwin-arm64 | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-darwin-x64 | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-freebsd-x64 | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-arm-gnueabihf | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-arm64-gnu | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-arm64-musl | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-x64-gnu | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-x64-musl | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-win32-arm64-msvc | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lightningcss-win32-x64-msvc | 1.33.0 | dev | 2026-07-20 | 73 | no | no | MPL-2.0 | — | 1 |
| lodash.merge | 4.6.2 | dev | 2019-07-10 | 2640 | no | no | MIT | — | 2 |
| magicast | 0.5.4 | dev | 2026-07-31 | 62 | no | no | MIT | 0.5.5 | 2 |
| make-dir | 4.0.0 | dev | 2023-06-23 | 1196 | no | no | MIT | 5.1.0 | 1 |
| nanoid | 3.3.18 | dev | 2026-08-07 | 55 | no | no | MIT | 6.0.1 | 1 |
| obug | 2.1.4 | dev | 2026-07-16 | 77 | no | no | MIT | 3.0.0 | 1 |
| parent-module | 1.0.1 | dev | 2019-03-28 | 2744 | no | no | MIT | 3.2.0 | 1 |
| path-exists | 4.0.0 | dev | 2019-04-04 | 2737 | no | no | MIT | 5.0.0 | 1 |
| picocolors | 1.1.1 | dev | 2024-10-16 | 714 | no | no | ISC | — | 1 |
| picomatch | 4.0.5 | dev | 2026-07-02 | 91 | no | no | MIT | 4.0.7 | 4 |
| pkce-challenge | 5.0.1 | dev | 2025-11-23 | 312 | no | no | MIT | 6.0.0 | 1 |
| postcss | 8.5.26 | dev | 2026-08-06 | 56 | no | no | MIT | 8.5.28 | 1 |
| punycode | 2.3.1 | dev | 2023-10-30 | 1066 | no | no | MIT | — | 2 |
| resolve-from | 4.0.0 | dev | 2017-09-23 | 3295 | no | no | MIT | 5.0.0 | 1 |
| semver | 7.8.5 | dev | 2026-06-19 | 103 | no | no | ISC | — | 4 |
| siginfo | 2.0.0 | dev | 2020-06-16 | 2297 | no | no | ISC | — | 1 |
| source-map-js | 1.2.1 | dev | 2024-09-08 | 753 | no | no | BSD-3-Clause | 1.2.2 | 1 |
| stackback | 0.0.2 | dev | 2012-10-20 | 5094 | no | no | MIT | — | 1 |
| strip-json-comments | 3.1.1 | dev | 2020-07-12 | 2272 | no | no | MIT | 5.0.3 | 1 |
| tinybench | 2.9.0 | dev | 2024-08-02 | 790 | no | no | MIT | 6.2.0 | 3 |
| tinyrainbow | 3.1.0 | dev | 2026-03-12 | 203 | no | no | MIT | 3.2.0 | 2 |
| undici-types | 8.9.0 | dev | 2026-07-24 | 69 | no | no | MIT | 8.11.2 | 2 |
| uri-js | 4.4.1 | dev | 2021-01-10 | 2090 | no | no | BSD-2-Clause | — | 1 |

## Familia: Puente HTTP/UXP (4)

Detrás de latest: 3. Edad mín/máx: 16/72 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @hono/node-server | 2.0.11 | **runtime** | 2026-07-21 | 72 | no | no | MIT | 2.1.3 | 1 |
| hono | 4.13.8 | **runtime** | 2026-09-15 | 16 | no | no | MIT | 4.13.12 | 1 |
| jose | 6.2.12 | **runtime** | 2026-09-05 | 26 | no | no | MIT | — | 1 |
| ws | 8.21.3 | **runtime** | 2026-08-07 | 55 | no | no | MIT | 8.22.0 | 1 |

## Familia: Telemetría (3)

Detrás de latest: 3. Edad mín/máx: 10/10 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @posthog/core | 1.55.1 | **runtime** | 2026-09-21 | 10 | no | no | MIT | 1.55.3 | 21 |
| @posthog/types | 1.412.4 | **runtime** | 2026-09-21 | 10 | no | no | MIT | 1.413.0 | 21 |
| posthog-node | 5.52.5 | **runtime** | 2026-09-21 | 10 | no | no | MIT | 5.55.0 | 22 |

## Familia: Tests (35)

Detrás de latest: 30. Edad mín/máx: 42/815 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @oxc-project/types | 0.146.0 | dev | 2026-08-19 | 43 | no | no | MIT | 0.152.0 | 1 |
| @rolldown/binding-android-arm-eabi | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-android-arm64 | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-darwin-arm64 | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-darwin-x64 | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-freebsd-x64 | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-arm-gnueabihf | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-arm64-gnu | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-arm64-musl | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-ppc64-gnu | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-s390x-gnu | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-x64-gnu | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-x64-musl | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-openharmony-arm64 | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-win32-arm64-msvc | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-win32-x64-msvc | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/pluginutils | 1.0.1 | dev | 2026-05-13 | 141 | no | no | MIT | — | 4 |
| @vitest/coverage-v8 | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| @vitest/expect | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| @vitest/mocker | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| @vitest/pretty-format | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| @vitest/runner | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | — | 5 |
| @vitest/snapshot | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| @vitest/spy | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| @vitest/utils | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| fdir | 6.5.0 | dev | 2025-08-14 | 413 | no | no | MIT | — | 1 |
| magic-string | 0.30.21 | dev | 2025-10-24 | 342 | no | no | MIT | 1.4.2 | 4 |
| pathe | 2.0.3 | dev | 2025-02-11 | 596 | no | no | MIT | — | 2 |
| rolldown | 1.2.5 | dev | 2026-08-19 | 43 | no | no | MIT | 1.2.12 | 4 |
| std-env | 4.2.0 | dev | 2026-07-07 | 85 | no | no | MIT | 4.3.0 | 1 |
| tinyexec | 1.2.4 | dev | 2026-05-31 | 123 | no | no | MIT | 1.3.1 | 1 |
| tinyglobby | 0.2.17 | dev | 2026-05-30 | 123 | no | no | MIT | — | 1 |
| vite | 8.2.2 | dev | 2026-08-20 | 42 | no | no | MIT | 8.3.2 | 2 |
| vitest | 4.1.11 | dev | 2026-08-18 | 44 | no | no | MIT | 5.0.3 | 5 |
| why-is-node-running | 2.3.0 | dev | 2024-07-08 | 815 | no | no | MIT | 3.2.2 | 2 |

## Familia: Tipos TS (6)

Detrás de latest: 2. Edad mín/máx: 12/1059 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @types/chai | 5.2.3 | dev | 2025-10-20 | 345 | no | no | MIT | — | 1 |
| @types/deep-eql | 4.0.2 | dev | 2023-11-07 | 1059 | no | no | MIT | — | 1 |
| @types/estree | 1.0.9 | dev | 2026-05-06 | 147 | no | no | MIT | — | 1 |
| @types/json-schema | 7.0.15 | dev | 2023-11-07 | 1059 | no | no | MIT | — | 1 |
| @types/node | 26.6.2 | dev | 2026-09-19 | 12 | no | no | MIT | 26.6.3 | 1 |
| @types/ws | 8.18.1 | dev | 2025-04-01 | 548 | no | no | MIT | 8.18.2 | 1 |

## Familia: Validación (2)

Detrás de latest: ninguno. Edad mín/máx: 17/289 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @standard-schema/spec | 1.1.0 | dev | 2025-12-15 | 289 | no | no | MIT | — | 2 |
| zod | 4.6.5 | **runtime** | 2026-09-13 | 17 | no | no | MIT | — | 1 |
