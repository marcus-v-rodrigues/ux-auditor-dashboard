"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Componente cliente para o formulário de Sign In
 * Usa o signIn do next-auth/react para iniciar o fluxo OAuth
 */
interface SignInFormProps {
  callbackUrl: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Manipula o clique no botão de login
   * Redireciona para o provider Janus IDP
   */
  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // O signIn redireciona automaticamente para o provedor OAuth
      await signIn("janus", { 
        callbackUrl,
        redirect: true 
      });
    } catch (error) {
      console.error("Erro ao iniciar login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSignIn}
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? "Carregando..." : "Sign in with Janus IDP"}
      </Button>
    </div>
  );
}
