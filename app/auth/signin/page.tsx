import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

/**
 * Página de entrada no sistema.
 * A autenticação é feita via Janus IDP.
 * Observação: `searchParams` é assíncrono no Next.js 15+.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Resolve os parâmetros de busca antes de renderizar a tela.
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Entre no UX Auditor
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Autentique-se com sua conta Janus IDP
          </p>
        </div>

        <SignInForm callbackUrl={callbackUrl} />

        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade.
          </p>
        </div>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Não tem uma conta?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
