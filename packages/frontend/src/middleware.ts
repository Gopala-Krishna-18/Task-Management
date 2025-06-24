import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
     * Protects all routes except for the ones starting with:
     * - /_next
     * - /api
     * - /static
     * - /public
     * - /favicon.ico
     * - /sign-in
     * - /sign-up
     */
    "/((?!_next|api|static|public|favicon.ico|sign-in|sign-up).*)",
  ],
};
