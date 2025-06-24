'use client';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-x-hidden">
      <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-gray-950" />
      <div className="relative z-10 max-w-xl w-full text-center py-12 rounded-xl shadow-lg bg-white/80">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-blue-900">Task Managing App</h1>
        <p className="text-lg text-gray-700 mb-8">
          Auto-generate, organize, and track your learning or project tasks with AI. Sign up to get started and boost your productivity!
        </p>
        <SignedOut>
          <div className="flex flex-col gap-4 items-center mb-4">
            <SignInButton>
              <Button size="lg" className="w-48">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline" size="lg" className="w-48">Sign Up</Button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex flex-col gap-4 items-center mb-4">
            <UserButton />
            <Link href="/dashboard">
              <Button size="lg" className="w-48">Go to Dashboard</Button>
            </Link>
          </div>
        </SignedIn>
        <div className="mt-8 text-xs text-gray-400">&copy; {new Date().getFullYear()} Task Managing App. All rights reserved.</div>
      </div>
    </main>
  );
}
