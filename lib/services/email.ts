/**
 * Email Service Interface
 * Mock implementation — replace with Resend or other email provider
 */

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface EmailService {
  sendEmail(payload: EmailPayload): Promise<{ id: string; success: boolean }>
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@prolang.mbg.mn'
const APP_NAME = 'ProLang Translation Services'

/**
 * Mock email service — logs to console
 */
export const mockEmailService: EmailService = {
  async sendEmail(payload: EmailPayload): Promise<{ id: string; success: boolean }> {
    const id = `mock-email-${Date.now()}-${Math.random().toString(36).slice(2)}`

    console.log(`\n📧 [MOCK EMAIL SERVICE]`)
    console.log(`From: ${payload.from || FROM_EMAIL}`)
    console.log(`To: ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`)
    console.log(`Subject: ${payload.subject}`)
    console.log(`Body: ${payload.text || payload.html.replace(/<[^>]*>/g, '')}`)
    console.log(`ID: ${id}\n`)

    // Simulate small network delay
    await new Promise(resolve => setTimeout(resolve, 50))

    return { id, success: true }
  },
}

/**
 * Resend email service implementation
 * Uncomment and install resend when ready
 */
// export class ResendEmailService implements EmailService {
//   private client: Resend
//   constructor() {
//     this.client = new Resend(process.env.RESEND_API_KEY!)
//   }
//   async sendEmail(payload: EmailPayload) {
//     const result = await this.client.emails.send({
//       from: payload.from || FROM_EMAIL,
//       to: payload.to,
//       subject: payload.subject,
//       html: payload.html,
//       text: payload.text,
//     })
//     return { id: result.data?.id || '', success: !result.error }
//   }
// }

export function getEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER || 'mock'

  switch (provider) {
    case 'resend':
      // return new ResendEmailService()
      console.warn('Resend not configured, falling back to mock')
      return mockEmailService
    case 'mock':
    default:
      return mockEmailService
  }
}

// Typed email notification functions
export async function sendJobReceivedEmail(customerEmail: string, jobTitle: string, jobId: string) {
  const service = getEmailService()
  return service.sendEmail({
    to: customerEmail,
    subject: `${APP_NAME} — Job Received: ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Your translation request has been received</h2>
        <p>Thank you for submitting your document for translation.</p>
        <p><strong>Job:</strong> ${jobTitle}</p>
        <p><strong>Job ID:</strong> ${jobId}</p>
        <p>Our team will review your document shortly. You'll receive an update when translation begins.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}" 
           style="background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          View Job Status
        </a>
        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
          ProLang Translation Services | prolang.mbg.mn
        </p>
      </div>
    `,
    text: `Your translation request "${jobTitle}" (ID: ${jobId}) has been received. Track your job at ${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}`,
  })
}

export async function sendJobInProgressEmail(customerEmail: string, jobTitle: string, jobId: string) {
  const service = getEmailService()
  return service.sendEmail({
    to: customerEmail,
    subject: `${APP_NAME} — Translation In Progress: ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Your document is being translated</h2>
        <p>A professional translator has started working on your document.</p>
        <p><strong>Job:</strong> ${jobTitle}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}"
           style="background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          Track Progress
        </a>
      </div>
    `,
    text: `Translation has started for "${jobTitle}". Track at ${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}`,
  })
}

export async function sendJobReadyEmail(customerEmail: string, jobTitle: string, jobId: string) {
  const service = getEmailService()
  return service.sendEmail({
    to: customerEmail,
    subject: `${APP_NAME} — Translation Ready: ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Your translated document is ready!</h2>
        <p>Your translation has been completed and certified.</p>
        <p><strong>Job:</strong> ${jobTitle}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}"
           style="background: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          Download Your Translation
        </a>
      </div>
    `,
    text: `Your translation "${jobTitle}" is ready for download at ${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}`,
  })
}

export async function sendAssignmentEmail(
  assigneeEmail: string,
  assigneeName: string,
  jobTitle: string,
  jobId: string,
  role: 'translator' | 'reviewer'
) {
  const service = getEmailService()
  const path = role === 'translator' ? 'translate' : 'review'
  return service.sendEmail({
    to: assigneeEmail,
    subject: `${APP_NAME} — New Assignment: ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">You have a new ${role} assignment</h2>
        <p>Hello ${assigneeName},</p>
        <p>You have been assigned to ${role === 'translator' ? 'translate' : 'review'} the following document:</p>
        <p><strong>Job:</strong> ${jobTitle}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/${path}/${jobId}"
           style="background: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
          Open ${role === 'translator' ? 'Translator' : 'Reviewer'} Workspace
        </a>
      </div>
    `,
    text: `You have a new ${role} assignment: "${jobTitle}". Open at ${process.env.NEXT_PUBLIC_APP_URL}/${path}/${jobId}`,
  })
}
