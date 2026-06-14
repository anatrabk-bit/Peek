// כתובת האתר הקבועה — חייבת להתאים לפורט שבו האתר רץ (ולהגדרות ב-Supabase)
export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3001";

  return url;
}
