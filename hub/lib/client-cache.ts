// Sistema automático y silencioso para limpiar caché del cliente
import { useState, useEffect } from 'react'

export function clearClientCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    // Limpiar localStorage completamente
    if (window.localStorage) {
      localStorage.clear()
    }
    
    // Limpiar sessionStorage completamente
    if (window.sessionStorage) {
      sessionStorage.clear()
    }
    
    // Limpiar TODAS las cachés del Service Worker
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }).catch(error => {
        // Silenciar errores para no molestar al usuario
      })
    }
    
    // Limpiar cookies relacionadas con la app
    if (document.cookie) {
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name && !name.startsWith('__Host-') && !name.startsWith('__Secure-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })
    }
  } catch (error) {
    // Silenciar errores para no molestar al usuario
  }
}

export function forceHardReload(): void {
  if (typeof window === 'undefined') return
  
  // Limpiar caché primero
  clearClientCache()
  
  // Esperar un poco a que se limpie
  setTimeout(() => {
    // Forzar recarga completa limpiando caché HTTP
    const url = new URL(window.location.href)
    url.searchParams.set('_t', Date.now().toString())
    url.searchParams.set('_clear', 'true')
    url.searchParams.set('_cache', 'busted')
    
    window.location.href = url.toString()
  }, 100)
}

// Hook automático que siempre limpia al cargar
export function useCacheCleaner() {
  const [isOldVersion, setIsOldVersion] = useState(false)
  
  useEffect(() => {
    const autoClean = () => {
      // Limpiar SIEMPRE al cargar la página
      // Esto elimina cualquier contenido cacheado anterior
      clearClientCache()
      
      // Detectar si hay contenido antiguo visible en el DOM
      const oldElements = document.querySelectorAll('[data-demo], [data-old], .demo-login, .old-content')
      const hasOldElements = oldElements.length > 0
      
      // También verificar si hay texto antiguo en el body
      const bodyText = document.body.textContent || ''
      const hasOldText = bodyText.includes('demo') || 
                        bodyText.includes('Demo') || 
                        bodyText.includes('test') ||
                        bodyText.includes('Test')
      
      // O si hay URLs antiguas en la página
      const hasOldUrls = window.location.search.includes('demo') || 
                        window.location.search.includes('test')
      
      // Si detectamos contenido antiguo, forzar recarga completa
      if (hasOldElements || hasOldText || hasOldUrls) {
        setIsOldVersion(true)
        
        // Forzar recarga después de limpiar
        setTimeout(() => {
          forceHardReload()
        }, 100)
      }
    }
    
    // Ejecutar inmediatamente al cargar
    autoClean()
    
    // También ejecutar después de un pequeño delay por si acaso
    const delayedClean = setTimeout(autoClean, 500)
    
    return () => clearTimeout(delayedClean)
  }, [])
  
  return { isOldVersion, clearClientCache, forceHardReload }
}

// Función de limpieza inmediata (uso interno)
export function cleanNow(): void {
  clearClientCache()
  setTimeout(() => {
    window.location.reload()
  }, 100)
}
