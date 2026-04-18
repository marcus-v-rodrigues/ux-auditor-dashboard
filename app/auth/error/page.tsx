"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Erro de configuração do servidor.",
  AccessDenied: "Você não tem acesso ao client ux-auditor.",
  AccessDeniedClient: "Você não tem acesso ao client ux-auditor.",
  AccessDeniedNoRoles: "Sua sessão autenticou, mas não trouxe roles válidas do Janus.",
  AuthRequired: "Autenticação necessária.",
  SessionInvalid: "Sessão inválida.",
  TokenExpired: "Token expirado. Faça login novamente.",
  TokenRejected: "Token rejeitado pelo backend.",
  Forbidden: "Acesso negado pelo backend.",
  Verification: "O token de verificação expirou ou já foi usado.",
  Default: "Ocorreu um erro durante a autenticação.",
  OAuthSignin: "Erro ao montar a URL de autorização.",
  OAuthCallback: "Erro ao processar a resposta do provedor OAuth.",
  OAuthCreateAccount: "Não foi possível criar a conta do provedor OAuth.",
  EmailCreateAccount: "Não foi possível criar a conta de e-mail.",
  Callback: "Erro no callback OAuth.",
  OAuthAccountNotLinked: "A conta de e-mail já está vinculada a outro provedor.",
  SessionRequired: "Faça login para acessar esta página.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "";

  const errorMessage = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="app-callout-error mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="app-heading text-2xl font-bold tracking-tight">
        Erro de autenticação
      </h2>
      <p className="app-text-soft mt-2 text-sm">
        {errorMessage}
      </p>
      {error ? (
        <p className="app-text-muted mt-1 text-xs font-mono">
          Código do erro: {error}
        </p>
      ) : null}
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <section className="min-h-[calc(100vh-4rem)] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center">
        <div className="app-panel-strong w-full space-y-8 rounded-2xl p-8">
          <Suspense
            fallback={
              <div className="flex flex-col items-center text-center">
                <div className="app-callout-error mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h2 className="app-heading text-2xl font-bold tracking-tight">
                  Erro de autenticação
                </h2>
                <p className="app-text-soft mt-2 text-sm">
                  Carregando...
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
              Tentar novamente
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full"
              variant="outline"
            >
              Ir para a página inicial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
