# QUICKSTART — Plugin UXP para usuarios finales

De cero a Premiere automatizado en 3 pasos. **No se pega ningún token a mano** (SEC 10 auto-pairing).

## 1. Instalar el panel

Doble click en `premiere-pro-mcp-uxp-<version>-direct.ccx` → lo instala Creative Cloud
(puede mostrar un aviso de confianza: es normal en paquetes UXP directos; el paquete
es determinista y su SHA256 está en `SHA256SUMS.txt`).

## 2. Configurar el server MCP en tu cliente (Codex/Claude/etc.)

```toml
[mcp_servers.premiere-pro]
command = "premiere-pro-mcp.cmd"
[mcp_servers.premiere-pro.env]
PREMIERE_UXP_TOKEN = 'uxp-<genera-una-frase-larga-aleatoria-de-32+-caracteres>'
```

Solo esa variable es necesaria: **el token de 16+ caracteres que tú elijas** (es la
llave compartida entre tu cliente y el panel). Nada de puertos: el server usa 7777 y,
si está ocupado, toma un puerto libre automáticamente y se lo pasa al panel.

## 3. Abrir Premiere

El panel (**Window → UXP Plugins → MCP for Adobe Premiere Pro**) lee el fichero de
emparejamiento que el server escribió y **conecta solo**. Estado esperado: `Connected`.

- El emparejamiento se rehace solo si el server cambia de puerto o de token.
- Si prefieres el emparejamiento manual de toda la vida, pon
  `PREMIERE_MCP_SEC_AUTO_PAIRING=0` en el server y pega URL/token en el panel
  (se recuerdan para las siguientes sesiones).
- El par TV del token también queda en tu fichero de config del cliente; si lo
  regeneras, la siguiente sesión del server re-escribe el fichero de emparejamiento.

## Qué es el fichero de emparejamiento (transparencia)

El server escribe `uxp-pairing.json` (URL del bridge + token + PID) en la carpeta de
datos del plugin (`%APPDATA%\Adobe\UXP\PluginsStorage\PPRO\<versión>\...\com.ppmcp.premiere.uxp\`)
y en el temp dir del bridge. Vive en tu perfil de usuario local; el server lo borra al
apagarse. Es la misma información que antes pegabas a mano en el panel — automatizada.
