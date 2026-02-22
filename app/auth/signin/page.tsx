import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

/**
 * Página de Sign In
 * Permite autenticação via Janus IDP
 * Nota: searchParams é assíncrono no Next.js 15+
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Resolve a Promise do searchParams (Next.js 15+)
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to UX Auditor Dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Authenticate using your Janus IDP account
          </p>
        </div>

        <SignInForm callbackUrl={callbackUrl} />

        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
