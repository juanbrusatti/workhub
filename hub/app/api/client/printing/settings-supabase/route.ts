import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    const { data: settings, error } = await supabase
      .from('printing_settings')
      .select('*')
      .eq('id', 'default')
      .single()
    
    if (error) {
      console.error("Supabase error:", error)
      
      // Si no existe, crear configuración por defecto
      const defaultSettings = {
        id: 'default',
        price_per_sheet: 5, // Default price $0.05 per sheet
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data: newSettings, error: insertError } = await supabase
        .from('printing_settings')
        .insert(defaultSettings)
        .select()
        .single()
      
      if (insertError) {
        console.error("Failed to create default settings:", insertError)
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 })
      }
      
      return NextResponse.json({ pricePerSheet: newSettings.price_per_sheet })
    }

    return NextResponse.json({ pricePerSheet: settings.price_per_sheet })

  } catch (error) {
    console.error("Failed to fetch printing settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
