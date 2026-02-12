# Control Personal Web

Aplicación web simple para llevar control de:

- Finanzas personales (monto inicial, ingresos extra, gastos fijos con cuotas y saldo restante)
- Notas importantes
- Contraseñas (guardadas localmente en tu navegador)

## Cómo usarla

1. Abrí el proyecto en tu computadora.
2. Ejecutá un servidor local:

```bash
python3 -m http.server 8080
```

3. Abrí en el navegador: `http://localhost:8080`

## Qué hace cada sección

### Finanzas

- **Monto inicial**: representa tu base (por ejemplo, sueldo).
- **Ingresos extra**: permite agregar plata adicional con detalle (changa, transferencia, etc.).
- **Gasto fijo**: permite registrar monto total y cantidad de cuotas.
- El sistema calcula automáticamente:
  - Monto inicial
  - Total de ingresos extra
  - Gastos del período (valor por cuota)
  - Dinero restante para usar

### Notas rápidas

Permite guardar y eliminar notas cortas.

### Contraseñas

Permite guardar accesos básicos (servicio, usuario, contraseña).

> ⚠️ Seguridad: en esta versión se guarda todo en `localStorage` del navegador. No usar para datos críticos reales sin cifrado y backend seguro.
