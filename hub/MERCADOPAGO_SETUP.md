# Configuración de MercadoPago QR

Esta guía te ayudará a configurar el sistema de pagos con QR de MercadoPago en tu aplicación.

## 🚀 Configuración Paso a Paso

### 1. Obtener credenciales de MercadoPago

1. **Crea una cuenta en MercadoPago** (si no tenés una):
   - Visita [https://www.mercadopago.com.ar/](https://www.mercadopago.com.ar/)
   - Registrate como vendedor

2. **Crea una aplicación**:
   - Ingresá a [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
   - Hacé clic en "Mis aplicaciones" y luego en "Crear aplicación"
   - Dále un nombre a tu aplicación (ej: "WorkHub Pagos")
   - Seleccioná "Web" como plataforma
   - Indicá la URL de tu sitio en producción y en modo prueba

3. **Obtené tus credenciales**:
   - Una vez creada la aplicación, copiá el **Access Token** de producción
   - También podés usar el Access Token de prueba para desarrollo

### 2. Configurar variables de entorno

Agregá las siguientes variables a tu archivo `.env.local`:

```bash
# Token de acceso de MercadoPago (obligatorio)
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL de tu aplicación (reemplazá con tu URL real)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# Secreto para webhook (opcional pero recomendado)
MP_WEBHOOK_SECRET=tu_secreto_aqui
```

**Importante**: Reemplazá `APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` con tu Access Token real de MercadoPago.

### 3. Configurar Webhook (opcional pero recomendado)

El webhook permite que tu aplicación reciba notificaciones automáticas cuando un pago es aprobado:

1. **Configurá el webhook en MercadoPago**:
   - En la configuración de tu aplicación, buscá "Webhooks"
   - Agregá la URL: `https://tu-dominio.com/api/mercadopago-webhook`
   - Seleccioná los eventos: `payment` y `payment_approved`

2. **Configurá el webhook en tu app**:
   - Si configuraste un secreto en el paso 2, las notificaciones estarán seguras
   - El webhook creará automáticamente las solicitudes de pago aprobadas

### 4. Probar la configuración

1. **Iniciá tu aplicación**:
   ```bash
   npm run dev
   ```

2. **Probá el flujo de pago**:
   - Iniciá sesión como cliente
   - Navegá a "Facturación y Pagos"
   - Hacé clic en "Pagar Ahora"
   - Seleccioná "QR MercadoPago"
   - Elegí el tipo de pago (mensualidad, impresiones o todo junto)
   - Hacé clic en "Generar Código QR"
   - Escaneá el QR con tu app de MercadoPago para probar

## 🔧 Características Implementadas

### ✅ Funcionalidades principales

- **Generación de QR**: Códigos QR dinámicos para cada pago
- **Múltiples tipos de pago**: Mensualidad, impresiones o ambos
- **Integración automática**: Pagos aprobados se registran automáticamente
- **Webhook seguro**: Notificaciones en tiempo real
- **Expiración de QR**: Los códigos expiran en 24 horas

### 🔄 Flujo de pago con QR

1. El cliente selecciona "QR MercadoPago" como método de pago
2. Elige qué quiere pagar (mensualidad, impresiones o ambos)
3. La app genera un código QR único
4. El cliente escanea el QR con MercadoPago
5. Paga directamente desde la app de MercadoPago
6. El webhook recibe la confirmación automáticamente
7. El pago se registra como aprobado en el sistema

### 📋 Flujo tradicional (transferencia)

1. El cliente selecciona "Transferencia" como método de pago
2. Ve los datos bancarios para la transferencia
3. Realiza la transferencia
4. Sube el comprobante de pago
5. El administrador aprueba manualmente el pago

## 🛠️ Solución de problemas

### Error: "MP_ACCESS_TOKEN no configurado"
- Asegurate de haber agregado el token al archivo `.env.local`
- Reiniciá el servidor después de modificar las variables de entorno

### Error: "Error al generar el código QR"
- Verificá que tu Access Token sea válido
- Asegurate de tener conexión a internet
- Revisá la consola del navegador para más detalles

### El webhook no recibe notificaciones
- Verificá que la URL del webhook sea accesible públicamente
- Asegurate de haber configurado los eventos correctos en MercadoPago
- Revisá los logs de tu aplicación

### Los pagos no se aprueban automáticamente
- Verificá que el webhook esté funcionando correctamente
- Asegurate de que la cuenta de MercadoPago esté verificada
- Revisá que los pagos no estén siendo retenidos por revisión manual

## 📚 Referencias útiles

- [Documentación de MercadoPago](https://www.mercadopago.com.ar/developers)
- [API de Pagos de MercadoPago](https://www.mercadopago.com.ar/developers/es/reference/payments/_payments/post)
- [Configuración de Webhooks](https://www.mercadopago.com.ar/developers/es/guides/notifications/webhooks)

## 🆘 Soporte

Si tenés problemas con la configuración:

1. Revisá los logs de tu aplicación
2. Verificá las credenciales de MercadoPago
3. Asegurate de que todas las variables de entorno estén configuradas
4. Probá con el Access Token de prueba primero

## 🚀 Proximamente

- Pagos con tarjetas de crédito directamente
- Historial de pagos QR
- Reembolsos automáticos
- Notificaciones push para pagos aprobados
