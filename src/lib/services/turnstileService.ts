/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Returns true (skips verification) if TURNSTILE_SECRET_KEY isn't configured,
 * so local dev and any deployment without Turnstile set up keep working.
 */
export async function verifyTurnstileToken(token: string | null | undefined, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;

  if (!token) return false;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token, remoteip: ip }),
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch (e: any) {
    console.error('[Turnstile] Verification request failed:', e.message || e);
    return false;
  }
}
