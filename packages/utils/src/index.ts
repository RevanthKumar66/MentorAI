// Shared utility functions for MentorAI OS

/**
 * Formats a size in bytes to a human-readable string (e.g., KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Delays execution for a specified number of milliseconds.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
