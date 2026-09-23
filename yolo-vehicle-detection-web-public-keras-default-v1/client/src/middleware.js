// src/middleware.js (หรือ middleware.js ที่ root)
import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  console.log("Middleware triggered for path:", pathname);

  // ดึง JWT และ email จาก cookie
  const jwt = req.cookies.get("jwt")?.value;
  const email = req.cookies.get("email")?.value;

  console.log("JWT in cookie:", jwt);
  console.log("Email in cookie:", email);

  // ถ้ามี JWT และอยู่ในหน้า /login ให้ redirect ไป /dashboard
  if (jwt && pathname === "/login") {
    console.log(
      "User already logged in, redirecting from /login to /dashboard"
    );
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // กำหนด protected paths
  const protectedPaths = ["/dashboard", "/vehiclehistory", "/analyze"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  console.log("Is this a protected path?", isProtected);

  // ถ้าเป็น protected path และไม่มี JWT หรือ email ให้ redirect ไป /login
  if (isProtected && (!jwt || !email)) {
    console.log("No JWT or email found, redirecting to /login from:", pathname);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ถ้ามี JWT และ email ใน protected path
  if (isProtected && jwt && email) {
    // กำหนด email ที่มีสิทธิ์เข้าถึงทุกหน้า
    const privilegedEmails = ["admin@email.com", "chotmanat@email.com"];
    const isPrivileged = privilegedEmails.includes(email);
    console.log("Is user privileged?", isPrivileged);

    // ตรวจสอบการเข้าถึง
    if (isPrivileged) {
      // ผู้ใช้ privileged เข้าถึงทุกหน้าได้
      console.log("Privileged user access granted for:", pathname);
      return NextResponse.next();
    } else {
      // ผู้ใช้ทั่วไป
      if (pathname.startsWith("/dashboard")) {
        // อนุญาตให้เข้าถึง /dashboard และ subpaths
        console.log("General user access granted for /dashboard");
        return NextResponse.next();
      } else {
        // ถ้าไม่ใช่ /dashboard (เช่น /vehiclehistory หรือ /analyze)
        console.log(
          "General user denied access to:",
          pathname,
          "redirecting to /unauthorized"
        );
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  // หน้าไม่ protected อนุญาตให้ผ่าน
  console.log("Access granted for non-protected path:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vehiclehistory/:path*",
    "/analyze/:path*",
    "/login",
  ],
};
