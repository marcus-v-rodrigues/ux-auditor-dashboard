"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Schema de validação do formulário de registro
 *
 * Validações aplicadas:
 * - name: string obrigatória
 * - email: formato de email válido
 * - password: mínimo de 8 caracteres
 */
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Tipo inferido do schema de validação
 */
type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Página de Registro de Usuários
 *
 * Permite que novos usuários criem uma conta no sistema UX Auditor.
 * Integra-se com a rota interna /api/auth/register que encaminha
 * para o endpoint POST /auth/register da API FastAPI.
 *
 * Funcionalidades:
 * - Formulário com validação via react-hook-form + zod
 * - Feedback visual durante submissão (loading state)
 * - Tratamento de erros com notificações toast
 * - Redirecionamento automático após sucesso
 */
export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  /**
   * Manipula o envio do formulário de registro
   *
   * Realiza a requisição POST para a rota interna /api/auth/register
   * que encaminha para a API FastAPI.
   * Não envia cabeçalhos de Authorization, pois é um endpoint público.
   *
   * Tratamento de respostas:
   * - 200/201: Sucesso - exibe toast e redireciona para /auth/signin
   * - 409: Conflito - e-mail já cadastrado
   * - Outros: Erro genérico
   *
   * @param data - Dados do formulário validados
   */
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // NOTA: Não enviamos Authorization header pois é um endpoint público
        },
        body: JSON.stringify(data),
      });

      // Trata resposta de sucesso (200 ou 201)
      if (response.status === 200 || response.status === 201) {
        toast.success("Account created successfully!");

        // Aguarda 2 segundos antes de redirecionar para o login
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
        return;
      }

      // Trata erro de conflito - e-mail já cadastrado (409)
      if (response.status === 409) {
        toast.error("Email is already in use");
        return;
      }

      // Trata erros genéricos
      toast.error("Failed to create account. Please try again later.");
    } catch (error) {
      // Trata erros de rede ou falhas inesperadas
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create Account
          </CardTitle>
          <CardDescription>
            Enter your details below to create your UX Auditor account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
                disabled={isLoading}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="border-input bg-background"
              />
              {errors.name && (
                <p
                  id="name-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Campo E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="border-input bg-background"
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register("password")}
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className="border-input bg-background"
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botão de Submit */}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            {/* Link para Login */}
            <div className="text-center">
              <Button
                variant="ghost"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/auth/signin">
                  Already have an account? Sign in
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}