import nodemailer from 'nodemailer'

interface PaymentRequestEmailData {
  userName: string
  userEmail: string
  amount: number
  planName: string
  period: string
  requestDate: string
  receiptImage?: string // Base64 image
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
      
      <ul>
        <li><strong>Cliente:</strong> ${data.userName}</li>
        <li><strong>Email:</strong> ${data.userEmail}</li>
        <li><strong>Plan:</strong> ${data.planName}</li>
        <li><strong>Período:</strong> ${data.period}</li>
        <li><strong>Monto:</strong> ${formattedAmount}</li>
        <li><strong>Fecha de solicitud:</strong> ${new Date(data.requestDate).toLocaleString('es-AR')}</li>
      </ul>
      
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
    const mailOptions: any = {
      from: process.env.EMAIL_USER,
      to: 'coworkhub25@gmail.com',
      subject: `Nueva Solicitud de Pago - ${data.userName}`,
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
