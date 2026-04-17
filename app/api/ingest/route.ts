import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedPost,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";
import { isRrwebEnvelope } from "@/lib/rrweb";
import type { SessionJobSubmissionResponse } from "@/types/dashboard";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isRrwebEnvelope(body)) {
      return NextResponse.json(
        {
          error:
            "Corpo da requisição inválido. Era esperado um objeto com rrweb.events não vazio.",
        },
        { status: 400 }
      );
    }

    const response = await authenticatedPost<SessionJobSubmissionResponse>("/ingest", body);

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
