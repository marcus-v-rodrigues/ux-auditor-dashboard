import { NextRequest, NextResponse } from "next/server";

/**
 * Interface para os dados de registro
 */
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Interface para a resposta da API externa
 */
interface ApiUserResponse {
  id: string;
  email: string;
  name?: string;
  janusId?: string;
}

/**
 * POST /api/auth/register
 * 
 * Rota de registro de novos usuários.
 * 
 * Fluxo:
 * 1. Valida os dados recebidos
 * 2. Encaminha a requisição para a API externa que:
 *    - Cria o usuário no Janus IDP
 *    - Persiste o UUID e dados básicos no banco PostgreSQL
 * 
 * @param request - Requisição Next.js com os dados de registro
 * @returns Response com status 201 em sucesso, 409 em conflito, 400/500 em erro
 */
export async function POST(request: NextRequest) {
  try {
    // Parse do corpo da requisição
    const body: RegisterRequest = await request.json();
    const { name, email, password } = body;

    // Validação básica dos campos
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação do formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de e-mail inválido" },
        { status: 400 }
      );
    }

    // Validação do tamanho da senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      );
    }

    // URL da API externa (configurada via variável de ambiente)
    const apiUrl = process.env.UX_AUDITOR_API_URL || "http://localhost:8000";

    // Encaminha a requisição para a API externa
    // A API externa é responsável por:
    // 1. Criar o usuário no Janus IDP
    // 2. Persistir os dados no banco PostgreSQL
    // NOTA: Endpoint público - não envia Authorization header
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    // Trata resposta de conflito (e-mail duplicado)
    if (response.status === 409) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 }
      );
    }

    // Trata outros erros da API
    if (!response.ok) {
      let errorMessage = "Erro ao criar a conta";
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Ignora erro de parse
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Sucesso - retorna dados do usuário criado
    const userData: ApiUserResponse = await response.json();

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          janusId: userData.janusId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Log error:", error);

    // Trata erro de conexão com a API
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Erro de conexão com o servidor. Tente novamente." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
