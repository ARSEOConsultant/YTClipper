/**
 * Returns the standard compliance notice.
 */
export function getComplianceNotice(): string {
  return "Only download or process videos you own, have permission to use, or that are licensed for reuse. This tool does not support bypassing DRM, private access, paywalls, or platform restrictions.";
}

/**
 * Checks if a video is allowed to be processed.
 * (Placeholder logic: could check against a blocklist, check DRM flags, etc.)
 */
export async function checkAllowedProcessing(url: string): Promise<{ allowed: boolean; reason?: string }> {
  // Mock implementation: always allowed unless it's a specific mock bad URL
  if (url.includes('not-allowed')) {
    return { allowed: false, reason: 'This video is protected by DRM or is not publicly available.' };
  }
  return { allowed: true };
}
