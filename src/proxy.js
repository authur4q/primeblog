import { NextResponse } from 'next/server';
import { ratelimit } from '../lib/ratelimit';

console.log("Ratelimit proxy loaded");

export async function proxy(request) {
  const { pathname } = request.nextUrl;


  if (
    pathname.startsWith('/api/auth') || 
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/_next')
  ) {
    console.log(`Skipping rate limiting for path: ${pathname}`);
    return NextResponse.next();
  }


  if (pathname.startsWith('/api/')) {
    const ip = request.ip ?? "127.0.0.1";
    console.log(`Applying rate limiting for path: ${pathname} | IP: ${ip}`);
    
    const { success, remaining, limit } = await ratelimit.limit(ip);
    console.log(`IP: ${ip} | Remaining: ${remaining} | Success: ${success}`);

    if (!success) {
      console.log("Too many Requests");
      

      return NextResponse.json(
        { error: "Too Many Requests", message: "Please slow down." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};