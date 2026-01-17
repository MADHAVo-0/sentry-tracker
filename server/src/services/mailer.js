const nodemailer = require('nodemailer');

// Configure transporter using Gmail. Use App Password for production.
// Required env vars: GMAIL_USER, GMAIL_PASS
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOtpEmail = async (to, code) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Your SENTRY-DOC login OTP',
    text: `Your OTP code is ${code}. It expires in ${process.env.OTP_EXP_MINUTES || 10} minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };