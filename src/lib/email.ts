import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendContactEmail(
  name: string,
  email: string,
  message: string
) {
  await transporter.sendMail({
    from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    replyTo: email,
    subject: `[Portfolio] Pesan dari ${name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Pesan Baru dari Portfolio</h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 80px;">Nama:</td>
            <td style="padding: 8px;">${name}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align:top;">Pesan:</td>
            <td style="padding: 8px; white-space: pre-wrap;">${message}</td>
          </tr>
        </table>
        <hr style="margin-top:24px; border-color:#e5e7eb;">
        <p style="color:#6b7280; font-size:12px;">Pesan ini dikirim dari form kontak portfolio Anda.</p>
      </div>
    `,
  });
}
