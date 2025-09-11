export const isBackendPage = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/project/") || // Only match /project/123, not /projects
  pathname.startsWith("/pdf-review") ||
  pathname.startsWith("/pdf-editor") ||
  pathname.startsWith("/admin") ||
  pathname.startsWith("/profile") ||
  pathname.startsWith("/create-staff") ||
  pathname.startsWith("/create-user") ||
  pathname.startsWith("/users") ||
  pathname.startsWith("/discussions") ||
  pathname.startsWith("/global-activity");
