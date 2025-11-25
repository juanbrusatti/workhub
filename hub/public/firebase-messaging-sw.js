importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config. These values are public config values.
firebase.initializeApp({
  apiKey: "AIzaSyCewoxp7xiyiSCIcmB-WQOj1WPZa181Iu0",
  authDomain: "coworkhub-web.firebaseapp.com",
  projectId: "coworkhub-web",
  storageBucket: "coworkhub-web.firebasestorage.app",
  messagingSenderId: "600995662142",
  appId: "1:600995662142:web:098922ced190683189c46f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = (payload && payload.notification && payload.notification.title) || 'Notificación'
  const options = {
    body: (payload && payload.notification && payload.notification.body) || '',
    icon: '/icon-192x192.png',
    data: (payload && payload.data) || {}
  }
  self.registration.showNotification(title, options)
});
