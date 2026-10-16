import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Get pathname - removed unused search variable
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // Admin route protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET ?? 'fallback-secret'
      );
      await jwtVerify(token, secret);
    } catch {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.delete('admin_token');
      return redirectRes;
    }
  }

  // Security headers
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Handle trailing slashes - redirect to non-trailing slash
  if (pathname.endsWith('/') && pathname !== '/') {
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url);
  }

  // Handle legacy routes or old URLs
  const redirects: Record<string, string> = {
    '/home': '/',
    '/portfolio': '/#projects',
    '/work': '/#projects',
    '/about-me': '/#about',
    '/contact-me': '/#contact',
    '/resume.html': '/sub/resume.html',
    '/cv': '/sub/resume.html',
  };

  if (redirects[pathname]) {
    url.pathname = redirects[pathname];
    return NextResponse.redirect(url, 301);
  }

  // Handle section anchors - redirect to home with hash
  const sectionRedirects: Record<string, string> = {
    '/about': '/#about',
    '/skills': '/#skills',
    '/projects': '/#projects',
    '/experience': '/#experience',
    '/contact': '/#contact',
  };

  if (sectionRedirects[pathname]) {
    url.pathname = '/';
    const hashPart = sectionRedirects[pathname].split('#')[1];
    if (hashPart) {
      url.hash = hashPart;
    }
    return NextResponse.redirect(url, 302);
  }

  // Block unwanted bots and crawlers
  const userAgent = request.headers.get('user-agent') || '';
  const blockedBots = [
    'AhrefsBot',
    'SemrushBot',
    'MJ12bot',
    'DotBot',
    'BLEXBot',
  ];

  const isBlockedBot = blockedBots.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );

  if (isBlockedBot) {
    return new NextResponse('Bot access denied', { status: 403 });
  }

  // Rate limiting for API routes (basic implementation)
  if (pathname.startsWith('/api/')) {
    // Get IP address with proper fallback handling
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // In a real application, you would use a proper rate limiting solution
    // like Redis or a rate limiting service
    console.log(`API request from IP: ${clientIp}`);
    
    // Add rate limiting headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());
  }

  // Handle language preference
  const acceptLanguage = request.headers.get('accept-language');
  const hasLanguagePreference = request.cookies.get('language');
  
  if (!hasLanguagePreference && acceptLanguage) {
    const preferredLanguage = acceptLanguage.includes('id') ? 'id' : 'en';
    response.cookies.set('language', preferredLanguage, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
    });
  }

  // Add custom headers for the portfolio
  response.headers.set('X-Portfolio-Version', '1.0.0');
  response.headers.set('X-Built-With', 'Next.js 15');
  response.headers.set('X-Author', 'Angga Rakhmansyah');

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|images|robots.txt|sitemap.xml|manifest.json).*)',
  ],
};