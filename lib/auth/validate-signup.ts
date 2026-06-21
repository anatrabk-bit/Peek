export function normalizeSignupEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeSignupPhone(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateSignupEmail(raw: string): string | null {
  const email = normalizeSignupEmail(raw);

  if (!email) {
    return "Enter your email address.";
  }

  if (email.length > 254) {
    return "That email address is too long.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address (e.g. you@example.com).";
  }

  return null;
}

export function validateSignupPhone(raw: string): string | null {
  const phone = normalizeSignupPhone(raw);

  if (!phone) {
    return "Enter your phone number.";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 7) {
    return "Phone number is too short. Use at least 7 digits.";
  }

  if (digits.length > 15) {
    return "Phone number is too long.";
  }

  if (!/^[\d\s+().-]+$/.test(phone)) {
    return "Phone number has invalid characters. Use digits, spaces, +, -, or ().";
  }

  return null;
}

export function isDuplicateSignupError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already been registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists")
  );
}
