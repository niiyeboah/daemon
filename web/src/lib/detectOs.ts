import type { OsChoice } from '@/types'

/**
 * Detect the user's OS from the browser for defaulting platform selection.
 * Only runs in the client; returns 'macos' when navigator is unavailable (SSR).
 */
export function detectOs(): OsChoice {
  if (typeof navigator === 'undefined') return 'macos'

  const ua = navigator.userAgent.toLowerCase()
  const platform =
    (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform?.toLowerCase() ??
    navigator.platform?.toLowerCase() ??
    ''

  if (platform.includes('win') || ua.includes('windows')) return 'windows'
  if (platform.includes('mac') || ua.includes('mac os') || ua.includes('macintosh')) return 'macos'
  if (platform.includes('linux') || ua.includes('linux') || ua.includes('cros')) return 'ubuntu'

  return 'macos'
}
