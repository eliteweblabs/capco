/**
 * Size classes for file icons: sm=12px, md=16px, lg=20px
 */
const FILE_ICON_SIZE_CLASS: Record<string, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Get file icon SVG based on file type.
 * Used by ProjectItem.astro (SSR) and project-item-handlers.ts (client).
 *
 * @param fileType - MIME type or extension
 * @param size - sm, md, lg. Default "sm"
 */
export function getFileIconSvg(
  fileType: string | null | undefined,
  size: "sm" | "md" | "lg" = "sm"
): string {
  const type = (fileType || "").toLowerCase();
  const sizeClass = FILE_ICON_SIZE_CLASS[size] || FILE_ICON_SIZE_CLASS.sm;

  if (type.includes("pdf")) {
    return `<svg class="${sizeClass} text-red-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
    </svg>`;
  }

  if (
    type.includes("image") ||
    type.includes("png") ||
    type.includes("jpg") ||
    type.includes("jpeg") ||
    type.includes("gif") ||
    type.includes("webp") ||
    type.includes("svg")
  ) {
    return `<svg class="${sizeClass} text-primary-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>`;
  }

  if (type.includes("word") || type.includes("doc")) {
    return `<svg class="${sizeClass} text-primary-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
    </svg>`;
  }

  if (type.includes("excel") || type.includes("sheet")) {
    return `<svg class="${sizeClass} text-green-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
    </svg>`;
  }

  if (type.includes("powerpoint") || type.includes("presentation")) {
    return `<svg class="${sizeClass} text-orange-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0  2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
    </svg>`;
  }

  if (type.includes("zip") || type.includes("rar") || type.includes("archive")) {
    return `<svg class="${sizeClass} text-purple-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
      <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
    </svg>`;
  }

  if (
    type.includes("video") ||
    type.includes("mp4") ||
    type.includes("avi") ||
    type.includes("mov")
  ) {
    return `<svg class="${sizeClass} text-pink-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 15V9l5 3-5 3z"/>
    </svg>`;
  }

  if (type.includes("audio") || type.includes("mp3") || type.includes("wav")) {
    return `<svg class="${sizeClass} text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>`;
  }

  return `<svg class="${sizeClass} text-gray-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1v5h5v10H6V3h7z"/>
  </svg>`;
}

/** Extract display name from file object (handles camelCase and snake_case) */
export function getFileName(file: {
  title?: string;
  fileName?: string;
  file_name?: string;
  name?: string;
  filePath?: string;
  file_path?: string;
}): string {
  return (
    file.title ||
    file.fileName ||
    file.file_name ||
    file.name ||
    (file.filePath || file.file_path || "").split("/").pop() ||
    "File"
  );
}
