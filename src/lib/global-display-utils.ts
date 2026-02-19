/**
 * Shared display utilities. Exported for server-side imports.
 * Also attached to window in app-globals for client-side use.
 */

/** Format file size; handles null/undefined (returns "—") */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get SimpleIcon name for file type (for use with <SimpleIcon name={...} />)
 */
export function getFileIcon(fileType: string | null | undefined, fileName?: string | null): string {
  if (!fileType && !fileName) return "file";
  const type = (fileType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  if (type.startsWith("image/") || name.match(/\.(webp|avif|svg|png|jpg|jpeg|gif|ico|bmp|tiff?)$/))
    return "image";
  if (type.includes("pdf") || name.endsWith(".pdf")) return "file-pdf";
  if (type.includes("word") || type.includes("document") || name.match(/\.(doc|docx)$/))
    return "file-word";
  if (type.includes("excel") || type.includes("spreadsheet") || name.match(/\.(xls|xlsx|csv)$/))
    return "spreadsheet";
  if (type.includes("video") || name.match(/\.(mp4|webm|mov|avi|mkv)$/)) return "video";
  if (type.includes("audio") || name.match(/\.(mp3|wav|ogg|m4a|flac)$/)) return "music";
  if (type.includes("zip") || type.includes("archive") || name.match(/\.(zip|rar|7z|tar|gz)$/))
    return "archive";
  return "file";
}

/** Format date for display. Handles null/undefined. */
export function formatDate(
  date: string | Date | null | undefined,
  options?: { format?: "long" | "medium" | "short" }
): string {
  if (date == null) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  if (options?.format === "short") return d.toLocaleDateString("en-US");
  if (options?.format === "medium") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format currency for display */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Validate email format; returns true if valid */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}
