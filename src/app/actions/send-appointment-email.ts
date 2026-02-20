'use server'

import { Resend } from 'resend'

// Inicializa com a chave (coloque no seu .env.local como RESEND_API_KEY)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAppointmentEmail({ 
  clientName, 
  clientEmail, 
  barberName, 
  serviceName, 
  date, 
  time 
}: any) {
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Hartmann Barbearia <onboarding@resend.dev>', // Use o domínio padrão do Resend para testar
      to: [clientEmail], // O email do cliente
      subject: '✂️ Agendamento Confirmado!',
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1>Olá, ${clientName}!</h1>
          <p>Seu estilo está garantido. Confira os detalhes:</p>
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9;">
            <p><strong>💈 Profissional:</strong> ${barberName}</p>
            <p><strong>✂️ Serviço:</strong> ${serviceName}</p>
            <p><strong>📅 Data:</strong> ${date} às ${time}</p>
          </div>
          <p>Se precisar remarcar, acesse sua conta no app.</p>
          <p>Atenciosamente,<br>Equipe Hartmann</p>
        </div>
      `,
    })

    if (error) {
      console.error("Erro ao enviar email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err }
  }
}