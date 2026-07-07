import { NextResponse, NextRequest } from 'next/server';

// Protected routes list
const protectedRoutes = [
  '/dashboard',
  '/catalog',
  '/settings',
  '/reports',
  '/users',
  '/sync-conflicts',
  '/warehouses',
  '/qr-generator',
  '/dictionaries',
  '/profile',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route) || pathname === route);

  if (isProtected) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirect to login page if token is missing
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Basic structural validation of JWT (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    try {
      // Base64Url decode payload to check expiration
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(base64);
      const payload = JSON.parse(payloadJson);

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        // Token is expired
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const response = NextResponse.redirect(url);
        response.cookies.delete('auth_token');
        return response;
      }
    } catch (e) {
      // Error decoding payload
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Allow request if route is not protected or token is valid
  return NextResponse.next();
}

// Configure routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/catalog/:path*',
    '/settings/:path*',
    '/reports/:path*',
    '/users/:path*',
    '/sync-conflicts/:path*',
    '/warehouses/:path*',
    '/qr-generator/:path*',
    '/dictionaries/:path*',
    '/profile/:path*',
  ],
};
