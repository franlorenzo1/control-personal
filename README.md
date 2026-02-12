# Control Personal Web

Aplicación web simple para llevar control de:

- Finanzas personales
- Notas importantes
- Contraseñas (guardadas localmente en tu navegador)

## Vistas disponibles

- `index.html` → Finanzas
- `notas.html` → Notas
- `contrasenas.html` → Contraseñas

Cada vista tiene navegación para ir a las otras secciones.

## Cómo usarla

1. Abrí el proyecto en tu computadora.
2. Ejecutá un servidor local:

```bash
python3 -m http.server 8080
```

3. Abrí en el navegador:
   - `http://localhost:8080/index.html`
   - `http://localhost:8080/notas.html`
   - `http://localhost:8080/contrasenas.html`

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

Permite crear, editar y eliminar notas.

### Contraseñas

Permite crear, editar y eliminar accesos (servicio, usuario, contraseña).

> ⚠️ Seguridad: en esta versión se guarda todo en `localStorage` del navegador. No usar para datos críticos reales sin cifrado y backend seguro.
