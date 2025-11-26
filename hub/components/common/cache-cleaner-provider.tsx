"use client"

import { useCacheCleaner } from "@/lib/client-cache"

export default function CacheCleanerProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useCacheCleaner()
  return <>{children}</>
}
