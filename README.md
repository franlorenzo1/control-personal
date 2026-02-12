# Control Personal Web

Aplicación web simple para llevar control de:

- Finanzas personales (monto total, sumar plata, gastos fijos y saldo restante)
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

- **Monto total inicial**: define tu plata base.
- **Agregar plata**: suma ingresos nuevos.
- **Gasto fijo**: agrega gastos (alquiler, internet, etc.).
- **Monto inicial**: representa tu base (por ejemplo, sueldo).
- **Ingresos extra**: permite agregar plata adicional con detalle (changa, transferencia, etc.).
- **Gasto fijo**: permite registrar monto total y cantidad de cuotas.
- El sistema calcula automáticamente:
  - Total disponible
  - Total de gastos fijos
  - Monto inicial
  - Total de ingresos extra
  - Gastos del período (valor por cuota)
  - Dinero restante para usar

### Notas rápidas

Permite guardar y eliminar notas cortas.

### Contraseñas

Permite guardar accesos básicos (servicio, usuario, contraseña).

> ⚠️ Seguridad: en esta versión se guarda todo en `localStorage` del navegador. No usar para datos críticos reales sin cifrado y backend seguro.

---

## Guía rápida para vos (aprendiendo Codex)

Como querés aprender mientras construimos, te dejo una forma práctica de trabajar conmigo:

1. **Pedime una mejora concreta**
   - Ejemplo: "agregá login" o "quiero exportar mis datos a Excel".
2. **Yo implemento cambios en el código**
   - Te explico qué archivo toqué y por qué.
3. **Corremos pruebas básicas**
   - Para validar que no se rompió nada.
4. **Iteramos en pasos chicos**
   - Mejoras pequeñas y claras para que aprendas rápido.

Si querés, en el próximo paso te armo:

- diseño más profesional,
- cifrado local para contraseñas,
- categorías de gastos,
- gráficos mensuales.