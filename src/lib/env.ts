const PLACEHOLDER_MARKERS = ["your-project", "your_project", "changeme", "example.supabase.co", "YOUR_ANON", "coloque-"];

export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) return null;
  if (PLACEHOLDER_MARKERS.some((marker) => url.includes(marker) || anonKey.includes(marker))) return null;
  if (anonKey.length < 20) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
