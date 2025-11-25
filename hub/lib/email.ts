import nodemailer from 'nodemailer'

interface PaymentRequestEmailData {
  userName: string
  userEmail: string
  amount: number
  planName: string
  period: string
  requestDate: string
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
    const emailContent = `
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

    // Enviar el email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'coworkhub25@gmail.com',
      subject: `Nueva Solicitud de Pago - ${data.userName}`,
      html: emailContent
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email enviado exitosamente:', result.messageId)
    
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error al enviar email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
