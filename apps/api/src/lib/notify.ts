export type LifecycleNotification = {
  type: "WELCOME" | "PAYMENT_EVENT" | "APPRAISAL_COMPLETE" | "ONBOARDING_COMPLETE";
  toEmail?: string | null;
  smsTo?: string | null;
  subject: string;
  message: string;
};

async function sendResendEmail(apiKey: string, to: string, subject: string, message: string): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Vex <onboarding@vex.local>",
      to: [to],
      subject,
      text: message,
    }),
  });
}

export async function sendLifecycleNotification(payload: LifecycleNotification): Promise<void> {
  const email = payload.toEmail?.trim();
  const smsTo = payload.smsTo?.trim();

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && email) {
    try {
      await sendResendEmail(resendKey, email, payload.subject, payload.message);
    } catch (err) {
      console.error("resend send failed", err);
    }
  }

  if (process.env.SMS_PROVIDER === "resend" && process.env.RESEND_API_KEY && smsTo) {
    // Placeholder for Resend SMS integration once enabled for the account.
    console.log(`[sms stub] ${smsTo}: ${payload.message}`);
  }
}
