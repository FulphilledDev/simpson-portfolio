"use client";

import { useCallback, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GlassCard from "@/components/ui/GlassCard";

// Google Identity Services button callback is loaded via script tag
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (parent: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setLoading(true);
      setError(null);
      try {
        await login(response.credential);
        const from = searchParams.get("from") || "/admin";
        router.replace(from);
      } catch {
        setError("Login failed. Make sure you're using the owner Google account.");
      } finally {
        setLoading(false);
      }
    },
    [login, router, searchParams]
  );

  // Initialize Google Identity Services on mount
  const initGsi = useCallback((node: HTMLDivElement | null) => {
    if (!node || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google?.accounts.id.renderButton(node, {
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 280,
      });
    };
    document.head.appendChild(script);
  }, [handleCredentialResponse]);

  return (
    <main className="min-h-screen bg-background bg-hero flex items-center justify-center px-4">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl animate-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-orb-2" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo / title */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-gradient-hero">PhitDev</div>
          <p className="text-white/50 text-sm">Admin Dashboard</p>
        </div>

        <GlassCard accent="cyan" className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-semibold text-white">Owner Sign In</h1>
            <p className="text-white/40 text-sm">Use your owner Google account to continue</p>
          </div>

          {/* Google Sign-In button rendered here */}
          <div className="flex justify-center">
            <div ref={initGsi} />
          </div>

          {loading && (
            <p className="text-center text-neon-cyan text-sm animate-pulse">Signing in…</p>
          )}

          {error && (
            <p className="text-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </GlassCard>

        <p className="text-center text-white/20 text-xs">
          Only the owner account can access this dashboard.
        </p>

        <div className="text-center">
          <a
            href="/"
            className="text-white/25 hover:text-white/60 text-xs transition-colors duration-200"
          >
            ← Back to main website
          </a>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
