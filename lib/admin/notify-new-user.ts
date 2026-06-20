import { getSiteUrl } from "@/lib/site-url";

type NotifyNewUserInput = {
  email: string;
  phone: string;
  userId: string;
};

export async function notifyAdminNewUser(
  input: NotifyNewUserInput
): Promise<{ sent: boolean; reason?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!adminEmail) {
    return { sent: false, reason: "ADMIN_EMAIL is not configured." };
  }

  if (!resendKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  const fromEmail =
    process.env.NOTIFY_FROM_EMAIL?.trim() ?? "Peek <onboarding@resend.dev>";
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
      from: fromEmail,
      to: adminEmail,
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
    const detail = await response.text();
    console.error("[Peek] Admin new-user email failed:", detail);
    return { sent: false, reason: "Email provider rejected the message." };
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
