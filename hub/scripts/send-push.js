const fs = require('fs')
const path = require('path')
const webpush = require('web-push')

const subPath = path.resolve(__dirname, 'subscription.json')

if (!fs.existsSync(subPath)) {
  console.error('Missing subscription file:', subPath)
  console.error('Create a file at scripts/subscription.json containing the subscription object (JSON) you copied from the browser')
  process.exit(1)
}

const raw = fs.readFileSync(subPath, 'utf8')
let subscription
try {
  subscription = JSON.parse(raw)
} catch (err) {
  console.error('Invalid JSON in scripts/subscription.json')
  console.error(err)
  process.exit(1)
}

const vapidPublic = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY

if (!vapidPublic || !vapidPrivate) {
  console.error('Missing VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment or .env.local')
  process.exit(1)
}

webpush.setVapidDetails('mailto:you@example.com', vapidPublic, vapidPrivate)

const payload = JSON.stringify({
  title: 'Prueba desde scripts/send-push',
  body: 'Notificación de prueba enviada desde el repo',
  icon: '/icon-192x192.png',
  data: { url: '/admin/payment-requests' }
})

webpush.sendNotification(subscription, payload)
  .then(() => {
    console.log('Push enviado OK')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error al enviar push:')
    console.error(err)
    process.exit(2)
  })
