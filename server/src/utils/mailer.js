import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export async function sendOtpEmail(to, otp) {
  const t = getTransporter()
  if (!t) {
    if (process.env.NODE_ENV !== 'production') console.log(`[mailer] Gmail not configured — dev OTP for ${to}: ${otp}`)
    return { delivered: false }
  }

  await t.sendMail({
    from: `Sankalp <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your Sankalp password reset code',
    html: `
      <div style="font-family: Arial, sans-serif; background:#05070f; padding:32px; color:#f5f6fa;">
        <div style="max-width:420px; margin:0 auto; background:#0f1526; border-radius:16px; padding:32px; border:1px solid rgba(255,255,255,0.1);">
          <p style="color:#eab424; letter-spacing:2px; font-size:12px; text-transform:uppercase; margin:0 0 12px;">Sankalp</p>
          <h2 style="margin:0 0 16px; font-size:20px;">Reset your password</h2>
          <p style="color:rgba(255,255,255,0.6); font-size:14px; line-height:1.6;">
            Use the code below to reset your Sankalp account password. This code expires in 10 minutes.
          </p>
          <p style="font-size:32px; font-weight:700; letter-spacing:8px; text-align:center; color:#eab424; margin:24px 0;">
            ${otp}
          </p>
          <p style="color:rgba(255,255,255,0.4); font-size:12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  })
  return { delivered: true }
}

export async function sendVerificationEmail(to, otp) {
  const t = getTransporter()
  if (!t) {
    if (process.env.NODE_ENV !== 'production') console.log(`[mailer] Gmail not configured — dev verification OTP for ${to}: ${otp}`)
    return { delivered: false }
  }

  await t.sendMail({
    from: `Sankalp <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Verify your Sankalp account',
    text: `Your Sankalp verification code is ${otp}. It expires in 10 minutes.`,
  })
  return { delivered: true }
}
