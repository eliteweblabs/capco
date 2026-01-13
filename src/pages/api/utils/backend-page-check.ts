export const isBackendPage = (pathname: string) => {
  const backendPaths = [
    "/admin",
    "/auth",
    "/profile",
    "/dashboard",
    "/project/", // Matches /project/123, /project/new, etc. but not /projects
  ];

  return backendPaths.some((path) => pathname.startsWith(path));
};
