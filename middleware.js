// an example nextJS middleware router that does server-side validation on all traffic to secure pages
import { NextResponse } from "next/server";
import { verifyTideCloakToken } from '/lib/tideJWT';

// Developer should list all secure pages and their respective allowed roles
const routesRoles = [
  { URLStart: "/adminprotected", role: 'appAdmin' },
  { URLStart: "/alsoprotected", role: 'offline_access' },
  { URLStart: "/protected", role: 'offline_access' },
  //{ URLStart: "/protected/dob", role: 'offline_access' },
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  
  var requiredRole = null;
  
  for (const { URLStart, role } of routesRoles) {
    if (pathname.startsWith(URLStart)) {
	    requiredRole = role;
		console.debug("[Middleware] Found role " + requiredRole);
		break;
    }
  }

  // Only protect routes starting with /protected
  if (requiredRole == null) {
	console.debug("[Middleware] skip next");
    return NextResponse.next();
  }
  
  try {
    // Extract token from cookie "kcToken"
    const token = req.cookies?.get('kcToken')?.value;

    if (!token) {
      console.debug("[Middleware] No token found -> redirecting to /");
      return NextResponse.redirect(new URL("/", req.url));
    }

    const user = await verifyTideCloakToken(token, requiredRole);
    
    if (user) {
  	  return NextResponse.next();
    }
  
    throw "Token verification failed.";
  } catch (err) {
	console.error("[Middleware] ", err);
    return NextResponse.redirect(new URL("/fail", req.url));
  }
  
}

//Which routes the middleware should run on:
export const config = {
  matcher: ["/protected/:path*"],
};
