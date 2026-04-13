import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedPost,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const _body = await request.json().catch(() => ({}));

    const data = await authenticatedPost(`/sessions/${uuid}/process`, _body);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao processar a sessão:", error);

    if (error instanceof AuthenticatedFetchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao processar a sessão" },
      { status: 500 }
    );
  }
}
