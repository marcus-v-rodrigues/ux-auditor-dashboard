import { NextRequest, NextResponse } from "next/server";
import { authenticatedPost } from "@/lib/authenticated-fetch";

/**
 * Rota de API: POST /api/ingest
 *
 * Rota de proxy que encaminha os dados da sessão para o backend da API do UX Auditor.
 * Utiliza o authenticatedPost para injetar automaticamente o token JWT do Janus IDP.
 *
 * Corpo da requisição: Array JSON de eventos rrweb
 * Resposta: { session_uuid: string, message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Realiza o parse do corpo da requisição
    const body = await request.json();

    // Valida se o corpo é um array de eventos
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected an array of rrweb events." },
        { status: 400 }
      );
    }

    // Encaminha para o backend da API com autenticação
    const response = await authenticatedPost<{ session_uuid: string; message?: string }>(
      "/ingest",
      body
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/ingest:", error);

    // Trata erros de autenticação
    if (error instanceof Error && error.message.includes("não autenticado")) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in again." },
        { status: 401 }
      );
    }

    // Trata outros erros
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const statusCode = (error as any)?.status || 500;

    return NextResponse.json(
      { error: `Failed to ingest session: ${errorMessage}` },
      { status: statusCode }
    );
  }
}