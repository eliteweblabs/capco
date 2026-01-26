export const isBackendPage = (pathname: string) => {
  const backendPaths = [
    "/admin",
    "/profile",
    "/dashboard",
    "/project/", // Matches /project/123, /project/new, etc. but not /projects
  ];

  return backendPaths.some((path) => pathname.startsWith(path));
};

export const isAuthPage = (pathname: string) => {
  const authPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/verify-email-otp",
    "/auth/verify-email-otp-resend",
    "/auth/verify-email-otp-resend",
  ];

  return authPaths.some((path) => pathname.startsWith(path));
};

export const isContactPage = (pathname: string) => {
  const contactPaths = ["/contact"];

  return contactPaths.some((path) => pathname.startsWith(path));
};
