"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * Componente de conteúdo da página de erro
 * Usa useSearchParams() que requer Suspense para prerender
 */
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    Default: "An error occurred during authentication.",
    OAuthSignin: "Error building the authorization URL.",
    OAuthCallback: "Error handling the response from an OAuth provider.",
    OAuthCreateAccount: "Could not create OAuth provider account.",
    EmailCreateAccount: "Could not create email provider account.",
    Callback: "Error in the OAuth callback handler.",
    OAuthAccountNotLinked:
      "Account email already linked with another provider.",
    SessionRequired: "Please sign in to access this page.",
  };

  const errorMessage = errorMessages[error || ""] || errorMessages.Default;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Authentication Error
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {errorMessage}
      </p>
      {error && (
        <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-500">
          Error code: {error}
        </p>
      )}
    </div>
  );
}

/**
 * Página de erro de autenticação
 * Exibe mensagens de erro amigáveis para diferentes tipos de falha
 */
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        {/* Suspense é necessário para useSearchParams durante o prerender */}
        <Suspense
          fallback={
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Authentication Error
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Loading...
              </p>
            </div>
          }
        >
          <ErrorContent />
        </Suspense>

        <div className="space-y-4">
          <Button
            onClick={() => (window.location.href = "/auth/signin")}
            className="w-full"
            variant="default"
          >
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full"
            variant="outline"
          >
            Go to Home Page
          </Button>
        </div>
      </div>
    </div>
  );
}
