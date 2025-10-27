export const isBackendPage = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/project/") || // Only match /project/123, not /projects
  pathname.startsWith("/pdf-review") ||
  pathname.startsWith("/pdf-editor") ||
  pathname.startsWith("/admin/") ||
  pathname.startsWith("/profile") ||
  pathname.startsWith("/create-staff") ||
  pathname.startsWith("/users") ||
  pathname.startsWith("/discussions") ||
  pathname.startsWith("/global-activity") ||
  pathname.startsWith("/analytics") ||
  pathname.startsWith("/admin/analytics") ||
  pathname.startsWith("/admin/discussions") ||
  pathname.startsWith("/admin/global-activity") ||
  pathname.startsWith("/admin/users") ||
  pathname.startsWith("/admin/payments") ||
  pathname.startsWith("/admin/uploads") ||
  pathname.startsWith("/admin/settings") ||
  pathname.startsWith("/admin/logs") ||
  pathname.startsWith("/admin/reports") ||
  pathname.startsWith("/register") ||
  pathname.startsWith("/project/new");
