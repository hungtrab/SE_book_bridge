import nodemailer from "nodemailer";

type AuthEmailKind = "verify-email" | "reset-password";

type AuthEmailInput = {
  kind: AuthEmailKind;
  email: string;
  token: string;
};

const PATH_BY_KIND: Record<AuthEmailKind, string> = {
  "verify-email": "/verify-email",
  "reset-password": "/reset-password",
};

const SUBJECT_BY_KIND: Record<AuthEmailKind, string> = {
  "verify-email": "Verify your BookBridge email",
  "reset-password": "Reset your BookBridge password",
};

export async function sendAuthEmail({ kind, email, token }: AuthEmailInput): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL(PATH_BY_KIND[kind], appUrl);
  url.searchParams.set("token", token);

  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_HOST must be configured before auth emails can be sent");
    }
    console.info(`[auth-email] ${SUBJECT_BY_KIND[kind]} for ${email}: ${url.toString()}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "BookBridge <noreply@bookbridge.local>",
    to: email,
    subject: SUBJECT_BY_KIND[kind],
    text: `Open this link to continue: ${url.toString()}`,
    html: `<p>Open this link to continue:</p><p><a href="${url.toString()}">${url.toString()}</a></p>`,
  });
}
