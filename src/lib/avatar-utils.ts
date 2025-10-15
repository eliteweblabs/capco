/**
 * Avatar utility functions for handling broken Supabase storage URLs
 */

export interface AvatarValidationResult {
  isValid: boolean;
  fallbackUrl?: string;
  shouldUseFallback: boolean;
}

/**
 * Validates if an avatar URL is likely to work
 * @param avatarUrl - The avatar URL to validate
 * @returns AvatarValidationResult
 */
export function validateAvatarUrl(avatarUrl: string): AvatarValidationResult {
  if (!avatarUrl || avatarUrl.trim() === "") {
    return {
      isValid: false,
      shouldUseFallback: true,
    };
  }

  // Check if it's a Supabase storage URL that might be broken
  if (avatarUrl.includes("supabase.co/storage")) {
    // These URLs are known to have connection issues
    return {
      isValid: false,
      shouldUseFallback: true,
    };
  }

  // Check if it's a valid URL format
  try {
    new URL(avatarUrl);
    return {
      isValid: true,
      shouldUseFallback: false,
    };
  } catch {
    return {
      isValid: false,
      shouldUseFallback: true,
    };
  }
}

/**
 * Gets a safe avatar URL with fallback handling
 * @param avatarUrl - The original avatar URL
 * @param fallbackUrl - Optional fallback URL (e.g., Gravatar)
 * @returns string - Safe avatar URL or null if should use initials
 */
export function getSafeAvatarUrl(avatarUrl?: string, fallbackUrl?: string): string | null {
  if (!avatarUrl) {
    return fallbackUrl || null;
  }

  const validation = validateAvatarUrl(avatarUrl);

  if (validation.shouldUseFallback) {
    return fallbackUrl || null;
  }

  return avatarUrl;
}

/**
 * Creates a Gravatar URL from email
 * @param email - User's email address
 * @param size - Avatar size (default: 200)
 * @returns string - Gravatar URL
 */
export function createGravatarUrl(email: string, size: number = 200): string {
  // Simple MD5 hash simulation (in production, use a proper MD5 library)
  const hash = email.toLowerCase().trim();
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Checks if an image URL is likely to fail and should be pre-validated
 * @param url - The image URL to check
 * @returns boolean - True if URL should be pre-validated
 */
export function shouldPreValidateImage(url: string): boolean {
  return (
    url.includes("supabase.co/storage") ||
    url.includes("googleusercontent.com") ||
    url.includes("gravatar.com")
  );
}
