export const isBackendPage = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/project/") || // Only match /project/123, not /projects
  pathname.startsWith("/pdf-review") ||
  pathname.startsWith("/pdf-editor") ||
  pathname.startsWith("/admin") ||
  pathname.startsWith("/create-staff");
