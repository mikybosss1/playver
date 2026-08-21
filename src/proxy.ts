// Next 16 renamed middleware.ts to proxy.ts — this is that file, not a
// custom reverse proxy. Its only job is next-intl's locale-detection/
// redirect middleware (e.g. "/" -> "/en" or "/fr" based on the visitor's
// Accept-Language / cookie). The matcher excludes _next, /api, and any path
// with a file extension, so API routes and static assets skip it.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
