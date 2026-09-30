# Auditoría de dependencias por familias — 2026-09-30

Grafo auditado: **213 paquetes únicos** (11 runtime / 202 dev). Paquetes con scripts de instalación en disco: ninguno.

## Resumen global

- Deprecadas: `eslint@9.39.5` — true
- Errores de consulta: `@adobe/premierepro-beta`
- Con scripts de ciclo de vida: ninguno

### Las 8 versiones más jóvenes del grafo (definen el `minimumReleaseAge` viable)

| Paquete | Versión | Capa | Publicada | Edad (días) |
|---|---|---|---|---|
| @typescript-eslint/parser | 8.70.1 | dev | 2026-09-21 | 9 |
| @typescript-eslint/project-service | 8.70.1 | dev | 2026-09-21 | 9 |
| @typescript-eslint/scope-manager | 8.70.1 | dev | 2026-09-21 | 9 |
| @typescript-eslint/tsconfig-utils | 8.70.1 | dev | 2026-09-21 | 9 |
| @typescript-eslint/types | 8.70.1 | dev | 2026-09-21 | 9 |
| @typescript-eslint/typescript-estree | 8.70.1 | dev | 2026-09-21 | 9 |
| @typescript-eslint/visitor-keys | 8.70.1 | dev | 2026-09-21 | 9 |
| @posthog/core | 1.55.1 | runtime | 2026-09-21 | 9 |

## Familia: Adobe (4)

Detrás de latest: 2. Edad mín/máx: 110/1077 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @adobe/cc-ext-uxp-types | 7.3.1 | dev | 2023-10-19 | 1077 | no | no | ? | — | 31 |
| @adobe/eslint-plugin-premierepro | 26.3.0 | dev | 2026-06-12 | 110 | no | no | Apache-2.0 | 26.5.0 | 31 |
| @adobe/premierepro | 26.3.0 | dev | 2026-06-12 | 110 | no | no | Apache-2.0 | 26.5.0 | 31 |
| @adobe/premierepro-beta | 26.5.0-beta.73 | dev | ? | ? | no | no | ? | — | 0 |

## Familia: Compilación TS (8)

Detrás de latest: 6. Edad mín/máx: 61/959 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @babel/helper-string-parser | 7.29.7 | dev | 2026-05-25 | 128 | no | no | MIT | 8.0.6 | 4 |
| @babel/helper-validator-identifier | 7.29.7 | dev | 2026-05-25 | 128 | no | no | MIT | 8.0.6 | 4 |
| @babel/parser | 7.29.8 | dev | 2026-07-31 | 61 | no | no | MIT | 7.29.9 | 4 |
| @babel/types | 7.29.8 | dev | 2026-07-31 | 61 | no | no | MIT | 8.0.6 | 4 |
| @jridgewell/resolve-uri | 3.1.2 | dev | 2024-02-14 | 959 | no | no | MIT | — | 1 |
| @jridgewell/sourcemap-codec | 1.5.5 | dev | 2025-08-12 | 414 | no | no | MIT | 1.6.0 | 1 |
| @jridgewell/trace-mapping | 0.3.31 | dev | 2025-09-10 | 384 | no | no | MIT | — | 1 |
| typescript | 5.9.3 | dev | 2025-09-30 | 364 | no | no | Apache-2.0 | 7.0.2 | 7 |

## Familia: Lint (71)

Detrás de latest: 45. Edad mín/máx: 9/3721 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @eslint-community/eslint-utils | 4.10.1 | dev | 2026-07-22 | 70 | no | no | MIT | — | 2 |
| @eslint-community/regexpp | 4.12.2 | dev | 2025-10-22 | 343 | no | no | MIT | — | 2 |
| @eslint/config-array | 0.21.2 | dev | 2026-03-06 | 208 | no | no | Apache-2.0 | 0.23.5 | 2 |
| @eslint/config-helpers | 0.4.2 | dev | 2025-10-29 | 336 | no | no | Apache-2.0 | 0.7.0 | 2 |
| @eslint/core | 0.17.0 | dev | 2025-10-29 | 336 | no | no | Apache-2.0 | 1.2.1 | 2 |
| @eslint/eslintrc | 3.3.6 | dev | 2026-07-10 | 81 | no | no | MIT | 3.3.7 | 2 |
| @eslint/js | 9.39.5 | dev | 2026-07-10 | 81 | no | no | MIT | 10.0.1 | 2 |
| @eslint/object-schema | 2.1.7 | dev | 2025-10-17 | 348 | no | no | Apache-2.0 | 3.0.5 | 2 |
| @eslint/plugin-kit | 0.4.1 | dev | 2025-10-29 | 336 | no | no | Apache-2.0 | 0.7.3 | 2 |
| @humanwhocodes/module-importer | 1.0.1 | dev | 2022-08-18 | 1504 | no | no | Apache-2.0 | — | 1 |
| @humanwhocodes/retry | 0.4.3 | dev | 2025-05-07 | 511 | no | no | Apache-2.0 | — | 1 |
| @typescript-eslint/parser | 8.70.1 | dev | 2026-09-21 | 9 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/project-service | 8.70.1 | dev | 2026-09-21 | 9 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/project-service | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/scope-manager | 8.70.1 | dev | 2026-09-21 | 9 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/scope-manager | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/tsconfig-utils | 8.70.1 | dev | 2026-09-21 | 9 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/tsconfig-utils | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/types | 8.70.1 | dev | 2026-09-21 | 9 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/types | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/typescript-estree | 8.70.1 | dev | 2026-09-21 | 9 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/typescript-estree | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/utils | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/visitor-keys | 8.70.1 | dev | 2026-09-21 | 9 | no | no | MIT | 8.71.0 | 2 |
| @typescript-eslint/visitor-keys | 8.65.0 | dev | 2026-07-20 | 72 | no | no | MIT | 8.71.0 | 2 |
| acorn | 8.18.0 | dev | 2026-07-28 | 64 | no | no | MIT | — | 3 |
| acorn-jsx | 5.3.2 | dev | 2021-07-09 | 1909 | no | no | MIT | — | 3 |
| ansi-styles | 4.3.0 | dev | 2020-10-04 | 2187 | no | no | MIT | 7.0.0 | 1 |
| balanced-match | 1.0.2 | dev | 2021-04-06 | 2003 | no | no | MIT | 4.0.4 | 1 |
| balanced-match | 4.0.4 | dev | 2026-02-22 | 220 | no | no | MIT | — | 1 |
| brace-expansion | 1.1.21 | dev | 2026-09-14 | 15 | no | no | MIT | 5.0.12 | 2 |
| brace-expansion | 5.0.12 | dev | 2026-09-14 | 15 | no | no | MIT | — | 2 |
| chalk | 4.1.2 | dev | 2021-07-30 | 1888 | no | no | MIT | 6.0.1 | 1 |
| color-convert | 2.0.1 | dev | 2019-08-19 | 2598 | no | no | MIT | 3.1.3 | 1 |
| color-name | 1.1.4 | dev | 2018-09-21 | 2931 | no | no | MIT | 2.1.1 | 3 |
| cross-spawn | 7.0.6 | dev | 2024-11-18 | 681 | no | no | MIT | — | 1 |
| debug | 4.4.3 | dev | 2025-09-13 | 382 | no | no | MIT | — | 2 |
| deep-is | 0.1.4 | dev | 2021-09-04 | 1852 | no | no | MIT | — | 1 |
| eslint | 9.39.5 | dev | 2026-07-10 | 81 | ⚠️ | no | MIT | 10.11.0 | 2 |
| eslint-scope | 8.4.0 | dev | 2025-06-09 | 478 | no | no | BSD-2-Clause | 9.1.2 | 2 |
| eslint-visitor-keys | 5.0.1 | dev | 2026-02-20 | 222 | no | no | Apache-2.0 | — | 2 |
| eslint-visitor-keys | 3.4.3 | dev | 2023-08-11 | 1146 | no | no | Apache-2.0 | 5.0.1 | 2 |
| eslint-visitor-keys | 4.2.1 | dev | 2025-06-09 | 478 | no | no | Apache-2.0 | 5.0.1 | 2 |
| espree | 10.4.0 | dev | 2025-06-09 | 478 | no | no | BSD-2-Clause | 11.2.0 | 2 |
| esquery | 1.7.0 | dev | 2025-12-31 | 273 | no | no | BSD-3-Clause | — | 2 |
| esrecurse | 4.3.0 | dev | 2020-08-31 | 2221 | no | no | BSD-2-Clause | — | 3 |
| estraverse | 5.3.0 | dev | 2021-10-25 | 1801 | no | no | BSD-2-Clause | — | 3 |
| esutils | 2.0.3 | dev | 2019-07-31 | 2618 | no | no | BSD-2-Clause | — | 2 |
| fast-levenshtein | 2.0.6 | dev | 2016-12-27 | 3563 | no | no | MIT | 3.0.0 | 1 |
| find-up | 5.0.0 | dev | 2020-08-11 | 2241 | no | no | MIT | 8.0.0 | 1 |
| has-flag | 4.0.0 | dev | 2019-04-06 | 2734 | no | no | MIT | 5.0.1 | 1 |
| isexe | 2.0.0 | dev | 2017-03-23 | 3478 | no | no | ISC | 4.0.0 | 1 |
| levn | 0.4.1 | dev | 2020-04-04 | 2370 | no | no | MIT | — | 1 |
| locate-path | 6.0.0 | dev | 2020-08-10 | 2242 | no | no | MIT | 8.0.0 | 1 |
| minimatch | 3.1.5 | dev | 2026-02-25 | 217 | no | no | ISC | 10.2.6 | 1 |
| minimatch | 10.2.6 | dev | 2026-07-27 | 65 | no | no | BlueOak-1.0.0 | — | 1 |
| ms | 2.1.3 | dev | 2020-12-08 | 2122 | no | no | MIT | — | 6 |
| natural-compare | 1.4.0 | dev | 2016-07-22 | 3721 | no | no | MIT | — | 1 |
| optionator | 0.9.4 | dev | 2024-04-26 | 886 | no | no | MIT | — | 1 |
| p-limit | 3.1.0 | dev | 2020-11-25 | 2135 | no | no | MIT | 7.3.3 | 1 |
| p-locate | 5.0.0 | dev | 2020-08-10 | 2242 | no | no | MIT | 7.0.0 | 1 |
| path-key | 3.1.1 | dev | 2019-11-22 | 2504 | no | no | MIT | 4.0.0 | 1 |
| prelude-ls | 1.2.1 | dev | 2020-04-02 | 2371 | no | no | MIT | — | 1 |
| shebang-command | 2.0.0 | dev | 2019-09-06 | 2581 | no | no | MIT | — | 1 |
| shebang-regex | 3.0.0 | dev | 2019-04-27 | 2713 | no | no | MIT | 4.0.0 | 1 |
| supports-color | 7.2.0 | dev | 2020-08-28 | 2224 | no | no | MIT | 11.0.0 | 1 |
| ts-api-utils | 2.5.0 | dev | 2026-03-19 | 195 | no | no | MIT | — | 1 |
| type-check | 0.4.0 | dev | 2020-04-03 | 2371 | no | no | MIT | — | 1 |
| which | 2.0.2 | dev | 2019-11-18 | 2507 | no | no | ISC | 7.0.0 | 4 |
| word-wrap | 1.2.5 | dev | 2023-07-22 | 1166 | no | no | MIT | — | 2 |
| yocto-queue | 0.1.0 | dev | 2020-11-24 | 2136 | no | no | MIT | 1.2.2 | 1 |

## Familia: MCP core (4)

Detrás de latest: 4. Edad mín/máx: 64/64 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @modelcontextprotocol/client | 2.0.0 | dev | 2026-07-27 | 64 | no | no | MIT | 2.2.0 | 5 |
| @modelcontextprotocol/core | 2.0.0 | **runtime** | 2026-07-27 | 64 | no | no | MIT | 2.2.0 | 5 |
| @modelcontextprotocol/node | 2.0.0 | **runtime** | 2026-07-27 | 64 | no | no | MIT | 2.1.0 | 5 |
| @modelcontextprotocol/server | 2.0.0 | **runtime** | 2026-07-27 | 64 | no | no | MIT | 2.2.0 | 6 |

## Familia: Otras (transitivas) (76)

Detrás de latest: 38. Edad mín/máx: 34/5093 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @bcoe/v8-coverage | 1.0.2 | dev | 2025-01-15 | 623 | no | no | MIT | — | 1 |
| @humanfs/core | 0.19.2 | dev | 2026-04-17 | 165 | no | no | Apache-2.0 | 0.20.0 | 1 |
| @humanfs/node | 0.16.8 | dev | 2026-04-17 | 165 | no | no | Apache-2.0 | 0.17.0 | 1 |
| @humanfs/types | 0.15.0 | dev | 2024-09-09 | 751 | no | no | Apache-2.0 | 0.16.0 | 1 |
| ajv | 6.15.0 | dev | 2026-04-23 | 160 | no | no | MIT | 8.20.0 | 2 |
| argparse | 2.0.1 | dev | 2020-08-28 | 2223 | no | no | Python-2.0 | 3.0.2 | 1 |
| assertion-error | 2.0.1 | dev | 2023-10-18 | 1078 | no | no | MIT | — | 1 |
| ast-v8-to-istanbul | 1.0.5 | dev | 2026-07-14 | 78 | no | no | MIT | 1.0.7 | 1 |
| callsites | 3.1.0 | dev | 2019-04-06 | 2734 | no | no | MIT | 4.2.0 | 1 |
| chai | 6.2.2 | dev | 2025-12-22 | 281 | no | no | MIT | 6.3.0 | 1 |
| concat-map | 0.0.1 | dev | 2014-01-30 | 4626 | no | no | MIT | 0.0.2 | 1 |
| convert-source-map | 2.0.0 | dev | 2022-10-17 | 1443 | no | no | MIT | — | 2 |
| detect-libc | 2.1.2 | dev | 2025-10-05 | 360 | no | no | Apache-2.0 | — | 1 |
| es-module-lexer | 2.3.1 | dev | 2026-07-12 | 80 | no | no | MIT | 3.0.2 | 1 |
| escape-string-regexp | 4.0.0 | dev | 2020-04-23 | 2351 | no | no | MIT | 5.0.0 | 1 |
| estree-walker | 3.0.3 | dev | 2023-01-20 | 1349 | no | no | MIT | — | 1 |
| eventsource | 3.0.7 | dev | 2025-05-09 | 509 | no | no | MIT | 5.1.2 | 2 |
| eventsource-parser | 3.0.6 | dev | 2025-08-29 | 397 | no | no | MIT | 4.1.1 | 1 |
| expect-type | 1.3.0 | dev | 2025-12-08 | 296 | no | no | Apache-2.0 | 1.4.0 | 1 |
| fast-deep-equal | 3.1.3 | dev | 2020-06-08 | 2305 | no | no | MIT | — | 1 |
| fast-json-stable-stringify | 2.1.0 | dev | 2019-12-14 | 2482 | no | no | MIT | — | 1 |
| file-entry-cache | 8.0.0 | dev | 2023-12-18 | 1017 | no | no | MIT | 11.1.5 | 1 |
| flat-cache | 4.0.1 | dev | 2024-03-02 | 942 | no | no | MIT | 6.1.23 | 1 |
| flatted | 3.4.4 | dev | 2026-07-30 | 62 | no | no | ISC | — | 1 |
| fsevents | 2.3.3 | dev | 2023-08-21 | 1136 | no | no | MIT | — | 2 |
| glob-parent | 6.0.2 | dev | 2021-09-29 | 1826 | no | no | ISC | — | 4 |
| globals | 14.0.0 | dev | 2024-02-10 | 963 | no | no | MIT | 17.12.0 | 4 |
| html-escaper | 2.0.2 | dev | 2020-03-27 | 2378 | no | no | MIT | 3.0.3 | 1 |
| ignore | 5.3.2 | dev | 2024-08-12 | 779 | no | no | MIT | 7.0.11 | 1 |
| import-fresh | 3.3.1 | dev | 2025-02-02 | 605 | no | no | MIT | 4.0.1 | 1 |
| imurmurhash | 0.1.4 | dev | 2013-08-24 | 4784 | no | no | MIT | — | 1 |
| is-extglob | 2.1.1 | dev | 2016-12-11 | 3580 | no | no | MIT | — | 2 |
| is-glob | 4.0.3 | dev | 2021-09-29 | 1827 | no | no | MIT | — | 3 |
| istanbul-lib-coverage | 3.2.2 | dev | 2023-11-08 | 1057 | no | no | BSD-3-Clause | — | 4 |
| istanbul-lib-report | 3.0.1 | dev | 2023-07-25 | 1163 | no | no | BSD-3-Clause | — | 4 |
| istanbul-reports | 3.2.0 | dev | 2025-08-18 | 408 | no | no | BSD-3-Clause | — | 5 |
| js-tokens | 10.0.0 | dev | 2025-12-08 | 295 | no | no | MIT | — | 1 |
| js-yaml | 4.3.2 | dev | 2026-08-26 | 34 | no | no | MIT | 5.4.2 | 1 |
| json-buffer | 3.0.1 | dev | 2018-09-10 | 2942 | no | no | MIT | — | 1 |
| json-schema-traverse | 0.4.1 | dev | 2018-06-10 | 3034 | no | no | MIT | 1.0.0 | 1 |
| json-stable-stringify-without-jsonify | 1.0.1 | dev | 2016-12-15 | 3575 | no | no | MIT | — | 1 |
| keyv | 4.5.4 | dev | 2023-10-07 | 1089 | no | no | MIT | 5.6.0 | 2 |
| lightningcss | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-android-arm64 | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-darwin-arm64 | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-darwin-x64 | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-freebsd-x64 | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-arm-gnueabihf | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-arm64-gnu | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-arm64-musl | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-x64-gnu | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-linux-x64-musl | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-win32-arm64-msvc | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lightningcss-win32-x64-msvc | 1.33.0 | dev | 2026-07-20 | 72 | no | no | MPL-2.0 | — | 1 |
| lodash.merge | 4.6.2 | dev | 2019-07-10 | 2639 | no | no | MIT | — | 2 |
| magicast | 0.5.4 | dev | 2026-07-31 | 61 | no | no | MIT | 0.5.5 | 2 |
| make-dir | 4.0.0 | dev | 2023-06-23 | 1195 | no | no | MIT | 5.1.0 | 1 |
| nanoid | 3.3.18 | dev | 2026-08-07 | 54 | no | no | MIT | 6.0.1 | 1 |
| obug | 2.1.4 | dev | 2026-07-16 | 76 | no | no | MIT | 3.0.0 | 1 |
| parent-module | 1.0.1 | dev | 2019-03-28 | 2743 | no | no | MIT | 3.2.0 | 1 |
| path-exists | 4.0.0 | dev | 2019-04-04 | 2736 | no | no | MIT | 5.0.0 | 1 |
| picocolors | 1.1.1 | dev | 2024-10-16 | 714 | no | no | ISC | — | 1 |
| picomatch | 4.0.5 | dev | 2026-07-02 | 90 | no | no | MIT | 4.0.7 | 4 |
| pkce-challenge | 5.0.1 | dev | 2025-11-23 | 311 | no | no | MIT | 6.0.0 | 1 |
| postcss | 8.5.26 | dev | 2026-08-06 | 55 | no | no | MIT | 8.5.28 | 1 |
| punycode | 2.3.1 | dev | 2023-10-30 | 1066 | no | no | MIT | — | 2 |
| resolve-from | 4.0.0 | dev | 2017-09-23 | 3294 | no | no | MIT | 5.0.0 | 1 |
| semver | 7.8.5 | dev | 2026-06-19 | 103 | no | no | ISC | — | 4 |
| siginfo | 2.0.0 | dev | 2020-06-16 | 2296 | no | no | ISC | — | 1 |
| source-map-js | 1.2.1 | dev | 2024-09-08 | 752 | no | no | BSD-3-Clause | 1.2.2 | 1 |
| stackback | 0.0.2 | dev | 2012-10-20 | 5093 | no | no | MIT | — | 1 |
| strip-json-comments | 3.1.1 | dev | 2020-07-12 | 2271 | no | no | MIT | 5.0.3 | 1 |
| tinybench | 2.9.0 | dev | 2024-08-02 | 789 | no | no | MIT | 6.2.0 | 3 |
| tinyrainbow | 3.1.0 | dev | 2026-03-12 | 202 | no | no | MIT | 3.2.0 | 2 |
| undici-types | 8.9.0 | dev | 2026-07-24 | 68 | no | no | MIT | 8.11.2 | 2 |
| uri-js | 4.4.1 | dev | 2021-01-10 | 2089 | no | no | BSD-2-Clause | — | 1 |

## Familia: Puente HTTP/UXP (4)

Detrás de latest: 3. Edad mín/máx: 15/71 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @hono/node-server | 2.0.11 | **runtime** | 2026-07-21 | 71 | no | no | MIT | 2.1.3 | 1 |
| hono | 4.13.8 | **runtime** | 2026-09-15 | 15 | no | no | MIT | 4.13.12 | 1 |
| jose | 6.2.12 | **runtime** | 2026-09-05 | 25 | no | no | MIT | — | 1 |
| ws | 8.21.3 | **runtime** | 2026-08-07 | 54 | no | no | MIT | 8.22.0 | 1 |

## Familia: Telemetría (3)

Detrás de latest: 3. Edad mín/máx: 9/9 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @posthog/core | 1.55.1 | **runtime** | 2026-09-21 | 9 | no | no | MIT | 1.55.2 | 21 |
| @posthog/types | 1.412.4 | **runtime** | 2026-09-21 | 9 | no | no | MIT | 1.413.0 | 21 |
| posthog-node | 5.52.5 | **runtime** | 2026-09-21 | 9 | no | no | MIT | 5.54.1 | 22 |

## Familia: Tests (35)

Detrás de latest: 30. Edad mín/máx: 41/814 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @oxc-project/types | 0.146.0 | dev | 2026-08-19 | 42 | no | no | MIT | 0.152.0 | 1 |
| @rolldown/binding-android-arm-eabi | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-android-arm64 | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-darwin-arm64 | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-darwin-x64 | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-freebsd-x64 | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-arm-gnueabihf | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-arm64-gnu | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-arm64-musl | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-ppc64-gnu | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-s390x-gnu | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-x64-gnu | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-linux-x64-musl | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-openharmony-arm64 | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-win32-arm64-msvc | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/binding-win32-x64-msvc | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| @rolldown/pluginutils | 1.0.1 | dev | 2026-05-13 | 140 | no | no | MIT | — | 4 |
| @vitest/coverage-v8 | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| @vitest/expect | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| @vitest/mocker | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| @vitest/pretty-format | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| @vitest/runner | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | — | 5 |
| @vitest/snapshot | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| @vitest/spy | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| @vitest/utils | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| fdir | 6.5.0 | dev | 2025-08-14 | 412 | no | no | MIT | — | 1 |
| magic-string | 0.30.21 | dev | 2025-10-24 | 341 | no | no | MIT | 1.4.2 | 4 |
| pathe | 2.0.3 | dev | 2025-02-11 | 596 | no | no | MIT | — | 2 |
| rolldown | 1.2.5 | dev | 2026-08-19 | 42 | no | no | MIT | 1.2.12 | 4 |
| std-env | 4.2.0 | dev | 2026-07-07 | 84 | no | no | MIT | 4.3.0 | 1 |
| tinyexec | 1.2.4 | dev | 2026-05-31 | 122 | no | no | MIT | 1.3.1 | 1 |
| tinyglobby | 0.2.17 | dev | 2026-05-30 | 123 | no | no | MIT | — | 1 |
| vite | 8.2.2 | dev | 2026-08-20 | 41 | no | no | MIT | 8.3.1 | 2 |
| vitest | 4.1.11 | dev | 2026-08-18 | 43 | no | no | MIT | 5.0.3 | 5 |
| why-is-node-running | 2.3.0 | dev | 2024-07-08 | 814 | no | no | MIT | 3.2.2 | 2 |

## Familia: Tipos TS (6)

Detrás de latest: 2. Edad mín/máx: 11/1058 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @types/chai | 5.2.3 | dev | 2025-10-20 | 344 | no | no | MIT | — | 1 |
| @types/deep-eql | 4.0.2 | dev | 2023-11-07 | 1058 | no | no | MIT | — | 1 |
| @types/estree | 1.0.9 | dev | 2026-05-06 | 146 | no | no | MIT | — | 1 |
| @types/json-schema | 7.0.15 | dev | 2023-11-07 | 1058 | no | no | MIT | — | 1 |
| @types/node | 26.6.2 | dev | 2026-09-19 | 11 | no | no | MIT | 26.6.3 | 1 |
| @types/ws | 8.18.1 | dev | 2025-04-01 | 547 | no | no | MIT | 8.18.2 | 1 |

## Familia: Validación (2)

Detrás de latest: ninguno. Edad mín/máx: 16/288 días.

| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |
|---|---|---|---|---|---|---|---|---|---|
| @standard-schema/spec | 1.1.0 | dev | 2025-12-15 | 288 | no | no | MIT | — | 2 |
| zod | 4.6.5 | **runtime** | 2026-09-13 | 16 | no | no | MIT | — | 1 |
