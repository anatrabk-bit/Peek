import { getSiteUrl } from "@/lib/site-url";

type NotifyNewUserInput = {
  email: string;
  phone: string;
  userId: string;
};

type NotifyResult = {
  sent: boolean;
  reason?: string;
};

/** Resend free tier: send from onboarding@resend.dev to your Resend account email. */
const RESEND_FROM = "Peek <onboarding@resend.dev>";

export function isAdminNotifyConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_EMAIL?.trim() && process.env.RESEND_API_KEY?.trim()
  );
}

export async function notifyAdminNewUser(
  input: NotifyNewUserInput
): Promise<NotifyResult> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!adminEmail) {
    return { sent: false, reason: "ADMIN_EMAIL is not configured in Vercel." };
  }

  if (!resendKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured in Vercel." };
  }

  const joinedAt = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });
  const adminUrl = `${getSiteUrl()}/admin`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [adminEmail],
      subject: `New Peek signup: ${input.email}`,
      html: `
        <h2>New user joined Peek</h2>
        <table cellpadding="8" style="border-collapse:collapse;">
          <tr><td><strong>Email</strong></td><td>${escapeHtml(input.email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(input.phone)}</td></tr>
          <tr><td><strong>User ID</strong></td><td>${escapeHtml(input.userId)}</td></tr>
          <tr><td><strong>Joined</strong></td><td>${escapeHtml(joinedAt)}</td></tr>
        </table>
        <p><a href="${adminUrl}">Open admin panel</a></p>
      `
    })
  });

  if (!response.ok) {
    let detail = await response.text();
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      detail = parsed.message ?? detail;
    } catch {
      // keep raw text
    }
    console.error("[Peek] Admin new-user email failed:", detail);
    return {
      sent: false,
      reason: `Resend error: ${detail.slice(0, 200)}`
    };
  }

  return { sent: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
