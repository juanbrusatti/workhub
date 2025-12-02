import nodemailer from 'nodemailer'

interface PaymentRequestEmailData {
  userName: string
  userEmail: string
  amount: number
  planName: string
  period: string
  requestDate: string
  receiptImage?: string // Base64 image
  paymentType?: 'membership' | 'printing' | 'both' // Tipo de pago
  description?: string // Descripción detallada del pago
  printAmount?: number // Monto de las impresiones
  printRecords?: string[] // IDs de registros de impresiones
  printSheets?: number // Cantidad total de hojas
}

interface AnnouncementEmailData {
  clientEmail: string
  clientName: string
  companyName: string
  title: string
  content: string
  type: 'info' | 'maintenance' | 'event'
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

export async function sendPaymentRequestEmail(data: PaymentRequestEmailData) {
  try {
    // Configurar el transporter de Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Formatear el monto
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(data.amount)

    // Crear el contenido del email
    let emailContent = `
      <h2>Nueva Solicitud de Pago</h2>
      <p>Se ha recibido una nueva solicitud de pago con los siguientes detalles:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>👤 Información del Cliente</h3>
        <ul>
          <li><strong>Cliente:</strong> ${data.userName}</li>
          <li><strong>Email:</strong> ${data.userEmail}</li>
          <li><strong>Fecha de solicitud:</strong> ${new Date(data.requestDate).toLocaleString('es-AR')}</li>
        </ul>
      </div>
      
      <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>💰 Detalles del Pago</h3>
    `

    // Agregar información específica según el tipo de pago
    if (data.paymentType === 'printing') {
      emailContent += `
        <p><strong>🖨️ Tipo de pago:</strong> Solo Impresiones</p>
        <ul>
          <li><strong>Período:</strong> ${data.period}</li>
          <li><strong>Cantidad de hojas:</strong> ${data.printSheets || 0}</li>
          <li><strong>Monto de impresiones:</strong> ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(data.printAmount || 0)}</li>
          <li><strong>Total a pagar:</strong> ${formattedAmount}</li>
        </ul>
      `
    } else if (data.paymentType === 'both') {
      const membershipAmount = data.amount - (data.printAmount || 0)
      emailContent += `
        <p><strong>💰 Tipo de pago:</strong> Mensualidad + Impresiones</p>
        <ul>
          <li><strong>Plan:</strong> ${data.planName}</li>
          <li><strong>Período mensualidad:</strong> ${data.period.replace('Impresiones ', '')}</li>
          <li><strong>Monto mensualidad:</strong> ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(membershipAmount)}</li>
          <li><strong>Cantidad de hojas:</strong> ${data.printSheets || 0}</li>
          <li><strong>Monto de impresiones:</strong> ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(data.printAmount || 0)}</li>
          <li><strong>Total a pagar:</strong> ${formattedAmount}</li>
        </ul>
      `
    } else {
      // Pago de mensualidad tradicional
      emailContent += `
        <p><strong>📋 Tipo de pago:</strong> Mensualidad</p>
        <ul>
          <li><strong>Plan:</strong> ${data.planName}</li>
          <li><strong>Período:</strong> ${data.period}</li>
          <li><strong>Monto:</strong> ${formattedAmount}</li>
        </ul>
      `
    }

    emailContent += `
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📋 Descripción:</strong> ${data.description || 'Solicitud de pago estándar'}</p>
      </div>
      
      <p>Por favor, revisa el panel de administración para gestionar esta solicitud.</p>
      
      <br>
      <p><em>Este es un mensaje automático generado por WorkHub.</em></p>
    `

    // Si hay comprobante, agregar información sobre el adjunto
    if (data.receiptImage) {
      emailContent += `
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>📎 Comprobante de pago adjunto</strong></p>
          <p>El cliente ha adjuntado el comprobante de transferencia. Revisa el archivo adjunto en este email.</p>
        </div>
      `
    }

    // Preparar las opciones del email
    let subject = `Nueva Solicitud de Pago - ${data.userName}`
    
    if (data.paymentType === 'printing') {
      subject = `🖨️ Nueva Solicitud de Pago (Impresiones) - ${data.userName}`
    } else if (data.paymentType === 'both') {
      subject = `💰 Nueva Solicitud de Pago (Mensualidad + Impresiones) - ${data.userName}`
    }
    
    const mailOptions: any = {
      from: process.env.EMAIL_USER,
      to: 'coworkhub25@gmail.com',
      subject: subject,
      html: emailContent
    }

    // Adjuntar el comprobante si está disponible
    if (data.receiptImage) {
      // Convertir base64 a buffer para el adjunto
      const base64Data = data.receiptImage.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      mailOptions.attachments = [
        {
          filename: `comprobante_${data.userName.replace(/\s+/g, '_')}_${data.period.replace(/\s+/g, '_')}.jpg`,
          content: buffer,
          contentType: 'image/jpeg'
        }
      ]
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email enviado exitosamente:', result.messageId)
    
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error al enviar email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

interface ApprovalEmailData {
  userName: string
  userEmail: string
  amount: number
  planName: string
  period: string
  nextPaymentPeriod?: string
}

export async function sendPaymentApprovalEmail(data: ApprovalEmailData) {
  try {
    // Configurar el transporter de Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Formatear el monto
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(data.amount)

    // Crear el contenido del email para el cliente
    const emailContent = `
      <h2>¡Tu Solicitud de Pago ha sido Aprobada! 🎉</h2>
      
      <p>Hola ${data.userName},</p>
      
      <p>Te informamos que tu solicitud de pago ha sido aprobada exitosamente.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Detalles del Pago:</h3>
        <ul>
          <li><strong>Plan:</strong> ${data.planName}</li>
          <li><strong>Período:</strong> ${data.period}</li>
          <li><strong>Monto pagado:</strong> ${formattedAmount}</li>
          <li><strong>Fecha de aprobación:</strong> ${new Date().toLocaleString('es-AR')}</li>
        </ul>
      </div>
      
      <p>Gracias por confiar en Ramos Generales para tus necesidades de coworking.</p>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      
      <br>
      <p><em>Este es un mensaje automático generado por Ramos Generales.</em></p>
    `

    // Enviar el email al cliente
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.userEmail,
      subject: `✅ Tu Pago ha sido Aprobado - Ramos Generales`,
      html: emailContent
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email de aprobación enviado exitosamente:', result.messageId)
    
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error al enviar email de aprobación:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

interface RejectionEmailData {
  userName: string
  userEmail: string
  amount: number
  planName: string
  period: string
  rejectionReason?: string
}

export async function sendPaymentRejectionEmail(data: RejectionEmailData) {
  try {
    // Configurar el transporter de Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Formatear el monto
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(data.amount)

    // Crear el contenido del email para el cliente
    const emailContent = `
      <h2>Información sobre tu Solicitud de Pago</h2>
      
      <p>Hola ${data.userName},</p>
      
      <p>Te informamos que tu solicitud de pago ha sido revisada y en este momento no ha sido aprobada.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3>Detalles de la Solicitud:</h3>
        <ul>
          <li><strong>Plan:</strong> ${data.planName}</li>
          <li><strong>Período:</strong> ${data.period}</li>
          <li><strong>Monto solicitado:</strong> ${formattedAmount}</li>
          <li><strong>Fecha de revisión:</strong> ${new Date().toLocaleString('es-AR')}</li>
        </ul>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Posibles causas del rechazo:</h3>
        <ul>
          <li>📋 <strong>Información incompleta:</strong> Puede que falten algunos datos en tu solicitud</li>
          <li>💳 <strong>Problemas con el método de pago:</strong> Revisa que los datos sean correctos</li>
          <li>📅 <strong>Disponibilidad del plan:</strong> El plan solicitado podría no estar disponible</li>
          <li>🔍 <strong>Requerimientos adicionales:</strong> Podríamos necesitar más documentación</li>
          <li>⏰ <strong>Tiempo de procesamiento:</strong> La solicitud podría requerir más tiempo de revisión</li>
        </ul>
      </div>
      
      <p><strong>¡No te preocupes!</strong> Estamos aquí para ayudarte a resolver cualquier inconveniente.</p>
      
      <p>Te recomendamos <strong>contactarnos lo antes posible</strong> para:</p>
      <ul>
        <li>Revisar juntos los detalles de tu solicitud</li>
        <li>Corregir cualquier información que falte</li>
        <li>Encontrar la mejor solución para tu caso</li>
      </ul>
      
      <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📧 Contacto rápido:</strong> Responde a este email o comunícate directamente con nosotros para asistencia inmediata.</p>
      </div>
      
      <p>Agradecemos tu comprensión y paciencia.</p>
      
      <br>
      <p><em>Este es un mensaje automático generado por Ramos Generales.</em></p>
    `

    // Enviar el email al cliente
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.userEmail,
      subject: `ℹ️ Información sobre tu Solicitud de Pago - Ramos Generales`,
      html: emailContent
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email de rechazo enviado exitosamente:', result.messageId)
    
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error al enviar email de rechazo:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function sendAnnouncementEmail(data: AnnouncementEmailData) {
  try {
    // Verificar variables de entorno
    console.log('🔍 Variables de entorno de Gmail:')
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? 'Configurado' : '❌ No configurado')
    console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Configurado' : '❌ No configurado')
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Variables de entorno de Gmail no configuradas')
    }

    // Configurar el transporter de Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    console.log('📧 Transporter de Gmail configurado')

    // Configurar colores y emojis según el tipo y prioridad
    const typeConfig = {
      info: { emoji: 'ℹ️', color: '#3b82f6', label: 'Información' },
      maintenance: { emoji: '🔧', color: '#f59e0b', label: 'Mantenimiento' },
      event: { emoji: '🎉', color: '#10b981', label: 'Evento' }
    }

    const priorityConfig = {
      low: { label: 'Baja', color: '#6b7280' },
      medium: { label: 'Media', color: '#f59e0b' },
      high: { label: 'Alta', color: '#ef4444' }
    }

    const typeInfo = typeConfig[data.type]
    const priorityInfo = priorityConfig[data.priority]

    // Crear el contenido del email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${typeInfo.color}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">${typeInfo.emoji}</div>
          <h1 style="color: white; margin: 0; font-size: 28px;">${data.title}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${typeInfo.label} - Prioridad ${priorityInfo.label}</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">👤 Información</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Cliente:</strong> ${data.clientName}</li>
              <li><strong>Empresa:</strong> ${data.companyName}</li>
              <li><strong>Fecha:</strong> ${data.createdAt.toLocaleString('es-AR')}</li>
              <li><strong>Tipo:</strong> <span style="color: ${typeInfo.color}; font-weight: bold;">${typeInfo.label}</span></li>
              <li><strong>Prioridad:</strong> <span style="color: ${priorityInfo.color}; font-weight: bold;">${priorityInfo.label}</span></li>
            </ul>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">📝 Mensaje</h3>
            <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">${data.content}</div>
          </div>
          
          ${data.priority === 'high' ? `
          <div style="background-color: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #dc2626; margin: 0; font-weight: bold; text-align: center;">
              ⚠️ ESTE ANUNCIO ES DE ALTA PRIORIDAD - POR FAVOR REVISAR INMEDIATAMENTE
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Este anuncio fue enviado automáticamente desde el sistema de gestión de CoWorkHub.
            </p>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
              Si tienes alguna pregunta, contacta al administrador de tu espacio de coworking.
            </p>
          </div>
        </div>
      </div>
    `

    // Determinar el asunto según tipo y prioridad
    let subject = `${typeInfo.emoji} ${data.title} - CoWorkHub`
    if (data.priority === 'high') {
      subject = `⚠️ URGENTE: ${data.title} - CoWorkHub`
    }

    // Enviar el email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.clientEmail,
      subject,
      html: emailContent
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`Email de anuncio enviado a ${data.clientEmail}:`, result.messageId)
    
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error al enviar email de anuncio:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

export async function sendReportEmail(data: {
  clientName: string
  clientEmail: string
  type: 'yerba' | 'broken' | 'other'
  priority: 'low' | 'medium' | 'high'
  message: string
  image: string | null
  reportId: string
  createdAt: Date
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const typeConfig = {
      yerba: { emoji: '🌿', label: 'Falta de insumos' },
      broken: { emoji: '🔧', label: 'Mantenimiento' },
      other: { emoji: '⚠️', label: 'Otro problema' }
    }

    const priorityConfig = {
      low: { label: 'Baja', color: '#6b7280' },
      medium: { label: 'Media', color: '#f59e0b' },
      high: { label: 'Alta', color: '#ef4444' }
    }

    const typeInfo = typeConfig[data.type]
    const priorityInfo = priorityConfig[data.priority]

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">${typeInfo.emoji}</div>
          <h1 style="color: white; margin: 0; font-size: 24px;">Nuevo Reporte de Cliente</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${typeInfo.label}</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">👤 Información del Cliente</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Cliente:</strong> ${data.clientName}</li>
              <li><strong>Email:</strong> ${data.clientEmail}</li>
              <li><strong>Fecha:</strong> ${data.createdAt.toLocaleString('es-AR')}</li>
              <li><strong>ID Reporte:</strong> ${data.reportId}</li>
            </ul>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">📋 Detalles del Reporte</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Tipo:</strong> ${typeInfo.label}</li>
              <li><strong>Prioridad:</strong> <span style="color: ${priorityInfo.color}; font-weight: bold;">${priorityInfo.label}</span></li>
            </ul>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <h3 style="color: #333; margin-top: 0;">💬 Mensaje</h3>
            <p style="color: #666; margin: 0; white-space: pre-wrap;">${data.message}</p>
          </div>

          ${data.image ? `
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">📸 Imagen Adjunta</h3>
            <p style="color: #666;">El cliente ha adjuntado una imagen. Revisar en el panel de administración.</p>
          </div>
          ` : ''}

          ${data.priority === 'high' ? `
          <div style="background-color: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #dc2626; margin: 0; font-weight: bold; text-align: center;">
              ⚠️ REPORTE DE ALTA PRIORIDAD - REQUIERE ATENCIÓN INMEDIATA
            </p>
          </div>
          ` : ''}

          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #0369a1; margin: 0; font-weight: bold; text-align: center;">
              Acceder al panel de administración para gestionar este reporte
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Este reporte fue enviado automáticamente desde el sistema de gestión de CoWorkHub.
            </p>
          </div>
        </div>
      </div>
    `

    const subject = data.priority === 'high' 
      ? `⚠️ URGENTE: ${typeInfo.label} - Reporte de ${data.clientName}`
      : `${typeInfo.emoji} Nuevo Reporte: ${typeInfo.label} de ${data.clientName}`

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'coworkhub25@gmail.com',
      subject,
      html: emailContent
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email de reporte enviado exitosamente:', result.messageId)
    
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error al enviar email de reporte:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
