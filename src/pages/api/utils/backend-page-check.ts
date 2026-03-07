export const isBackendPage = (pathname: string) => {
  const backendPaths = [
    "/admin",
    "/profile",
    "/dashboard",
    "/project/", // Matches /project/123, /project/new, etc. but not /projects
    "/voice-assistant-vapi",
    "/agent",
  ];

  return backendPaths.some((path) => pathname.startsWith(path));
};

export const isAuthPage = (pathname: string) => {
  const authPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/reset",
    "/auth/verify-email",
    "/auth/verify-email-otp",
    "/auth/verify-email-otp-resend",
    "/auth/callback",
  ];

  return authPaths.some((path) => pathname.startsWith(path));
};

export const isContactPage = (pathname: string) => {
  const p = (pathname || "").trim().toLowerCase();
  const norm = p && !p.startsWith("/") ? `/${p}` : p;
  return norm === "/contact" || norm.startsWith("/contact/") || norm === "/mep-form" || norm.startsWith("/mep-form/");
};
