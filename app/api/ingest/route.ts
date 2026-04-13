import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedPost,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Corpo da requisição inválido. Era esperado um array de eventos rrweb." },
        { status: 400 }
      );
    }

    const response = await authenticatedPost<{ session_uuid: string; message?: string }>(
      "/ingest",
      body
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro em /api/ingest:", error);

    if (error instanceof AuthenticatedFetchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    const statusCode = error instanceof Error ? 500 : 500;
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json(
      { error: `Falha ao importar a sessão: ${message}` },
      { status: statusCode }
    );
  }
}
