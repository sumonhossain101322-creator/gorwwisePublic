import nodemailer from "nodemailer";

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM?.trim() || user;
  if (!host || !user || !pass || !from) return null;
  return { host, user, pass, port, from };
}

export async function sendOtpEmail({ to, otp }) {
  const smtp = smtpConfig();

  if (!smtp) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured.");
    }
    console.info(`OTP for ${to}: ${otp} (SMTP is not configured; development only)`);
    return { mocked: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong style="letter-spacing:4px;font-size:20px">${otp}</strong>.</p><p>It expires in 10 minutes. If you did not try to create an account, you can ignore this email.</p>`,
  });

  return { mocked: false };
}

function appOrigin() {
  const base = process.env.NEXTAUTH_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (!base) return "http://localhost:3000";
  return base.startsWith("http") ? base.replace(/\/$/, "") : `https://${base.replace(/\/$/, "")}`;
}

export async function sendNotificationEmail({ to, name, subject, message, path = "/profile" }) {
  const smtp = smtpConfig();
  const url = `${appOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";

  if (!smtp) {
    if (process.env.NODE_ENV === "production") return { skipped: true };
    console.info(`Notification email for ${to}: ${subject}\n${message}\n${url}`);
    return { mocked: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: subject || "New notification on GrowWise",
    text: `${greeting}\n\n${message}\n\nOpen: ${url}`,
    html: `<p>${greeting}</p><p>${message}</p><p><a href="${url}">View on GrowWise</a></p>`,
  });

  return { mocked: false };
}
