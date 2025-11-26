import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { recordIds } = await request.json()
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren IDs válidos de registros de impresión' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Actualizar todos los registros de impresión como pagados
    const { data, error } = await supabase
      .from('print_records')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .in('id', recordIds)
      .select()

    if (error) {
      console.error('Error al marcar impresiones como pagadas:', error)
      return NextResponse.json(
        { error: 'Error al actualizar los registros de impresión' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${recordIds.length} registros de impresión marcados como pagados`,
      records: data
    })

  } catch (error) {
    console.error('Error en el endpoint de marcado masivo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
