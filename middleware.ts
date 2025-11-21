import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { locales, defaultLocale } from "./i18n";

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always", // Always show locale in URL
});

export async function middleware(request: NextRequest) {
  // Handle i18n first
  const response = intlMiddleware(request);
  
  try {
    // Extract locale from pathname
    const pathname = request.nextUrl.pathname;
    const locale = locales.find(
      (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
    ) || defaultLocale;

    // Remove locale from pathname for route checking
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    
    // Skip auth check for API routes (except auth routes)
    if (pathWithoutLocale.startsWith("/api/") && !pathWithoutLocale.startsWith("/api/auth/")) {
      return response;
    }

    // Check authentication for protected routes
    const { isAuthenticated } = getKindeServerSession();
    const authenticated = await isAuthenticated();

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/settings", "/transcription"];
    
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathWithoutLocale.startsWith(route)
    );

    // If protected route and not authenticated, redirect to login
    if (isProtectedRoute && !authenticated) {
      const loginUrl = new URL(`/${locale}/api/auth/login`, request.url);
      loginUrl.searchParams.set(
        "post_login_redirect_url",
        pathname
      );
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (error) {
    // If error in middleware, log and allow continuation
    console.error("Middleware error:", error);
    
    // For protected routes, redirect to login on error for security
    const pathname = request.nextUrl.pathname;
    const locale = locales.find(
      (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
    ) || defaultLocale;
    
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    const protectedRoutes = ["/dashboard", "/settings", "/transcription"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathWithoutLocale.startsWith(route)
    );
    
    if (isProtectedRoute) {
      const loginUrl = new URL(`/${locale}/api/auth/login`, request.url);
      loginUrl.searchParams.set(
        "post_login_redirect_url",
        pathname
      );
      return NextResponse.redirect(loginUrl);
    }
    
    // For other routes, allow continuation even with error
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - but we need to handle /api/auth
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
