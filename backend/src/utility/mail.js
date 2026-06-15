const config = require('../../config/env');

function createTransporter() {
  if (!config.email.enabled) {
    return null;
  }

  const nodemailer = require('nodemailer');

  // If using placeholder credentials, don't try to send via real SMTP
  if (config.email.user === 'your-email@gmail.com') {
    return null; // logic in sendMail will handle logging
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
}

async function sendMail({ to, subject, text, html }) {
  if (!config.email.enabled) {
    console.log('--- EMAIL SIMULATION ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('------------------------');
    return;
  }

  const transporter = createTransporter();

  if (!transporter) {
    console.log('--- EMAIL LOGGED TO CONSOLE (STILL SET TO PLACEHOLDER) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('----------------------------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    text,
    html,
  });
}

async function sendVerificationEmail(email, token) {
  const verificationUrl = `${config.appUrl}/api/auth/verify-email/${token}`;
  const subject = 'Verify your University Portal account';
  const text = `Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>If you did not create an account, you can ignore this email.</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

async function sendPasswordSetupEmail(email, token) {
  const setupUrl = `${config.appUrl}/auth/setup-password/${token}`;
  const subject = 'Complete your University Portal account setup';
  const text = `Please complete your account setup by following the link below:\n\n${setupUrl}\n\nThis link will expire in 24 hours.`;
  const html = `
    <p>Please complete your account setup by following the link below:</p>
    <p><a href="${setupUrl}">${setupUrl}</a></p>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendMail({ to: email, subject, text, html });
}

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendPasswordSetupEmail,
};
