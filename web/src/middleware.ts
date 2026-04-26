import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Protected routes that require authentication
  const protectedRoutes = ['/(authenticated)'];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route.replace('/(authenticated)', ''))
  );

  if (isProtectedRoute && !token) {
    // Redirect to signin if accessing protected route without token
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Allow public routes
  if (['/auth/signin', '/auth/consent', '/auth/profile-setup', '/terms', '/privacy'].includes(
    request.nextUrl.pathname
  )) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
