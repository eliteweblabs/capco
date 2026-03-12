import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const forwardedHost = context.request.headers.get("x-forwarded-host");
  const rawHost = (forwardedHost || context.request.headers.get("host") || "")
    .split(",")[0]
    ?.trim();

  if (!rawHost) return next();

  const hostWithoutPort = rawHost.replace(/:\d+$/, "").toLowerCase();
  if (!hostWithoutPort.startsWith("www.")) return next();

  const apexHost = hostWithoutPort.slice(4);
  if (!apexHost) return next();

  const targetUrl = new URL(context.request.url);
  targetUrl.protocol = "https:";
  targetUrl.host = apexHost;

  return context.redirect(targetUrl.toString(), 301);
});
