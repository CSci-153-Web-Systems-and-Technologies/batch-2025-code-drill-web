import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request);
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');

  // If user is not authenticated and trying to access protected routes
  if (!user && !isAuthPage && !isAuthCallback) {
    const redirectUrl = new URL('/login', request.url);
    return Response.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth pages
  if (user && isAuthPage) {
    const redirectUrl = new URL('/', request.url);
    return Response.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
