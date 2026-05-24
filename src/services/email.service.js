const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendResetCode(toEmail, code) {
  await transporter.sendMail({
    from: `SmartRide <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1a8a4a;">SmartRide</h2>
        <p>Your password reset code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a8a4a; text-align: center; padding: 20px; background: #f0faf4; border-radius: 8px;">
          ${code}
        </div>
        <p style="color: #888; font-size: 13px;">This code expires in 10 minutes.</p>
      </div>
    `
  });
}

module.exports = { sendResetCode };