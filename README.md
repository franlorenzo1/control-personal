# Control Personal

Aplicación de escritorio desarrollada con Node.js y Electron para la gestión y control personal.

---

## Requisitos

Antes de ejecutar el proyecto es necesario tener instalado:

* Node.js 18 o superior
* npm (incluido con Node.js)

Verificar instalación:

```bash
node -v
npm -v
```

Si alguno de los comandos falla, descargar Node.js desde:

https://nodejs.org

---

## Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repositorio>
```

o descargar el archivo ZIP y extraerlo.

### 2. Ingresar a la carpeta del proyecto

```bash
cd control-personal
```

### 3. Instalar dependencias

```bash
npm install
```

---

## Ejecutar la aplicación

### Modo normal

```bash
npm start
```

Este comando ejecuta:

```bash
node server.js
```

---

### Modo escritorio (Electron)

```bash
npm run electron
```

Se abrirá la aplicación como programa de escritorio.

---

## Distribución para otra PC

El proyecto incluye una versión empaquetada para Windows.

Ubicación:

```text
dist-app/
```

o

```text
Control-Personal-1.0.0-win-x64.zip
```

### Ejecutar sin instalar Node.js

1. Descomprimir el archivo ZIP.
2. Abrir la carpeta extraída.
3. Ejecutar el archivo `.exe`.

No es necesario instalar Node.js ni ejecutar comandos.

---

## Generar una nueva versión ejecutable

Para crear nuevamente la distribución de Windows:

```bash
npm run dist:win
```

Esto generará una nueva versión dentro de la carpeta:

```text
dist-app/
```

---

## Estructura principal

```text
├── server.js
├── package.json
├── build.js
├── dist-app/
└── ...
```

### Archivos importantes

| Archivo      | Descripción                      |
| ------------ | -------------------------------- |
| server.js    | Punto de entrada principal       |
| package.json | Dependencias y scripts           |
| build.js     | Proceso de empaquetado           |
| dist-app     | Versiones listas para distribuir |

---

## Solución de problemas

### "node no se reconoce como un comando"

Instalar Node.js y reiniciar la terminal.

### Error al instalar dependencias

Eliminar:

```text
node_modules
package-lock.json
```

y ejecutar nuevamente:

```bash
npm install
```

### La aplicación no abre

Verificar que todas las dependencias se hayan instalado correctamente:

```bash
npm install
```

y luego ejecutar:

```bash
npm run electron
```

---

## Autor

Francisco Lorenzo

Tecnicatura Universitaria en Programación - UTN
