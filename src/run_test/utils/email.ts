import nodemailer from "nodemailer";

/* ================= EMAIL ================= */

export async function sendFailureEmail(subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"run_test Bot" <${process.env.EMAIL_USER}>`,
    to: process.env.ALERT_TO,
    subject,
    html,
  });
}

export function buildMinimalFailureEmail(data: {
  step: number;
  url: string;
  create_testedFirstP: string;
  liveFirstP: string;
  reason?: string;
}) {
  return `
    <h2 style="color:red;">❌ Web run_test Failed</h2>

    <p><strong>Step:</strong> ${data.step}</p>
    <p><strong>URL:</strong> ${data.url}</p>

    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}

    <hr/>

    <p><strong>create_tested firstP:</strong></p>
    <pre>${data.create_testedFirstP}</pre>

    <p><strong>run_tested firstP:</strong></p>
    <pre>${data.liveFirstP}</pre>
  `;
}
