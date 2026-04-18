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
    <section className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
        
        {/* Bloco Esquerda */}
        <div className="app-panel grid gap-3 hidden rounded-[28px] p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div>
              <h1 className="app-heading mt-3 max-w-xl text-4xl font-semibold tracking-tight text-white">
                Transforme interações em diagnósticos de acessibilidade e UX
              </h1>
              <p className="app-text-soft mt-4 max-w-2xl text-base leading-7">
                O UX Auditor centraliza a coleta via extensão e o processamento multimodal para que você identifique fricções de interface com precisão técnica.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="app-panel-muted rounded-2xl p-4">
                <p className="app-eyebrow text-[10px] uppercase tracking-wider">Replay</p>
                <p className="app-heading mt-2 text-sm leading-snug">
                  Visualização técnica de interações sincronizadas com o ambiente.
                </p>
              </div>
              <div className="app-panel-muted rounded-2xl p-4">
                <p className="app-eyebrow text-[10px] uppercase tracking-wider">Processamento</p>
                <p className="app-heading mt-2 text-sm leading-snug">
                  Pipeline de análise para estados de fila, falha e reprocessamento de dados.
                </p>
              </div>
              <div className="app-panel-muted rounded-2xl p-4">
                <p className="app-eyebrow text-[10px] uppercase tracking-wider">Histórico</p>
                <p className="app-heading mt-2 text-sm leading-snug">
                  Repositório centralizado de auditorias recorrentes para análise de evolução.
                </p>
              </div>
            </div>
          </div>

          <div className="app-callout-info flex items-center rounded-2xl px-4 py-3">
            <div className="bg-brand-soft shadow-brand-soft/70 h-2.5 w-2.5 rounded-full shadow-[0_0_16px]" />
            <p className="text-sm font-medium">
              Janus IDP como provedor único de autenticação.
            </p>
          </div>
        </div>

        {/* Bloco Direita */}
        <div className="app-panel-strong flex flex-col justify-center rounded-[28px] p-6 md:p-10">
          <div className="text-center">
            <p className="app-eyebrow text-[11px] uppercase tracking-widest">UX Auditor</p>
            <h2 className="app-heading mt-3 text-3xl font-semibold tracking-tight text-white">
              Entrar no dashboard
            </h2>
            <p className="app-text-soft mt-3 text-sm leading-6">
              Autentique-se com sua conta Janus IDP para continuar.
            </p>
          </div>

          <div className="mt-8">
            <SignInForm callbackUrl={callbackUrl} />
          </div>

          <div className="app-elevated app-text-soft mt-8 rounded-2xl px-4 py-3 text-center text-[11px] leading-relaxed">
            Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade.
          </div>
        </div>
      </div>
    </section>
  );
}
