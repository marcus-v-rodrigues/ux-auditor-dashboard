import type { RrwebSessionEvent, SessionRawResponse } from "@/types/dashboard";

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyArray(value: unknown): value is RrwebSessionEvent[] {
  return Array.isArray(value) && value.length > 0;
}

export function extractRrwebEvents(value: unknown): RrwebSessionEvent[] | null {
  if (!isRecord(value)) {
    return null;
  }

  if (isNonEmptyArray(value.events)) {
    return value.events;
  }

  const rrweb = value.rrweb;
  if (isRecord(rrweb) && isNonEmptyArray(rrweb.events)) {
    return rrweb.events;
  }

  return null;
}

export function isSessionRawResponse(value: unknown): value is SessionRawResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.user_id === "string" &&
    typeof value.session_uuid === "string" &&
    typeof value.timestamp === "string" &&
    isNonEmptyArray(value.events) &&
    isRecord(value.metadata)
  );
}

export function isRrwebEnvelope(value: unknown): value is {
  rrweb: { events: RrwebSessionEvent[] };
} {
  return extractRrwebEvents(value) !== null;
}
