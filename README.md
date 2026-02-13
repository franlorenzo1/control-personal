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
- Cada sección tiene enlaces a las otras 2 secciones.

## Cómo usarla

1. Abrí el proyecto en tu computadora.
2. Ejecutá un servidor local:

```bash
python3 -m http.server 8080
```

3. Abrí en el navegador:
   - `http://localhost:8080/index.html`

## Qué hace cada sección

### Finanzas

- **Monto inicial**: representa tu base (por ejemplo, sueldo).
- **Ingresos extra**: permite agregar plata adicional con detalle (changa, transferencia, etc.).
- **Gasto fijo**:
  - monto total,
  - cantidad de cuotas,
  - mes del primer débito.
- El sistema muestra además:
  - cuotas restantes,
  - mes de finalización de cada gasto,
  - resumen mensual de gastos vigentes.

### Notas rápidas

Permite crear, editar y eliminar notas (edición inline, sin popups).

### Contraseñas

Permite crear, editar y eliminar accesos (servicio, usuario, contraseña) con edición inline, sin popups.

> ⚠️ Seguridad: en esta versión se guarda todo en `localStorage` del navegador. No usar para datos críticos reales sin cifrado y backend seguro.


## Nota sobre actualización en GitHub

Si aceptás un PR en GitHub pero no ves cambios en tu copia local, ejecutá:

```bash
git checkout main
git pull origin main
```

Y si trabajás en otra rama, traé cambios con:

```bash
git checkout <tu-rama>
git pull origin <tu-rama>
```
