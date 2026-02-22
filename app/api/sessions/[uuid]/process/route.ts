import { NextRequest, NextResponse } from "next/server";
import { authenticatedPost } from "@/lib/authenticated-fetch";

/**
 * POST /api/sessions/[uuid]/process
 * 
 * Proxy para o endpoint de processamento de sessão da API externa.
 * Mantém a autenticação no servidor usando o helper authenticatedPost.
 * 
 * @param request - Requisição Next.js
 * @param params - Parâmetros da rota (uuid da sessão)
 * @returns Response com os dados processados
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    // Usa o helper authenticatedPost para fazer a requisição com token JWT
    const data = await authenticatedPost(`/sessions/${uuid}/process`, {});

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing session:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Error processing session" },
      { status: 500 }
    );
  }
}
