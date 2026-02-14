# Control Personal Web

Aplicación web simple para llevar control de:

- Finanzas personales
- Notas importantes
- Contraseñas (guardadas localmente en tu navegador)

## Estructura de vistas

- `index.html` → **Inicio** (3 botones para entrar a cada sección)
- `finanzas.html` → Finanzas
- `notas.html` → Notas
- `contrasenas.html` → Contraseñas

Regla de navegación:

- La vista principal tiene 3 accesos (uno por sección).
- Cada sección muestra también los 3 enlaces (Finanzas, Notas y Contraseñas), marcando la vista actual.

## Cómo usarla

1. Abrí el proyecto en tu computadora.
2. Ejecutá un servidor local:

```bash
python3 -m http.server 8080
