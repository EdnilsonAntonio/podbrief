import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function middleware(request: NextRequest) {
  try {
    const { isAuthenticated } = getKindeServerSession();
    const authenticated = await isAuthenticated();

    // Rotas protegidas que requerem autenticação
    const protectedRoutes = ["/dashboard", "/settings", "/transcription"];
    
    // Verificar se a rota atual é protegida
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    // Se for rota protegida e não estiver autenticado, redirecionar para login
    if (isProtectedRoute && !authenticated) {
      const loginUrl = new URL("/api/auth/login", request.url);
      loginUrl.searchParams.set(
        "post_login_redirect_url",
        request.nextUrl.pathname
      );
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // Se houver erro no middleware (ex: problema com Kinde), logar e permitir continuar
    // Isso evita que erros no middleware quebrem toda a aplicação
    console.error("Middleware error:", error);
    
    // Para rotas protegidas, em caso de erro, redirecionar para login por segurança
    const protectedRoutes = ["/dashboard", "/settings", "/transcription"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );
    
    if (isProtectedRoute) {
      const loginUrl = new URL("/api/auth/login", request.url);
      loginUrl.searchParams.set(
        "post_login_redirect_url",
        request.nextUrl.pathname
      );
      return NextResponse.redirect(loginUrl);
    }
    
    // Para outras rotas, permitir continuar mesmo com erro
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

