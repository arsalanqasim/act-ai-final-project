export type ClientErrorArea = 'render' | 'network' | 'storage' | 'feature';

export interface ClientErrorContext {
  area: ClientErrorArea;
  feature?: string;
  operation?: string;
  online?: boolean;
}

interface SafeClientErrorEvent {
  name: string;
  message: string;
  area: ClientErrorArea;
  feature?: string;
  operation?: string;
  online?: boolean;
  timestamp: string;
}

const MAX_MESSAGE_LENGTH = 160;

function safeText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\s+/g, ' ').slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Local-only, client-safe diagnostics. This intentionally accepts metadata only
 * and never transmits user content, tokens, resumes, or provider credentials.
 */
export function reportClientError(error: unknown, context: ClientErrorContext): void {
  const event: SafeClientErrorEvent = {
    name: error instanceof Error ? safeText(error.name) || 'Error' : 'UnknownError',
    message: error instanceof Error ? safeText(error.message) || 'Unexpected client error' : 'Unexpected client error',
    area: context.area,
    feature: safeText(context.feature),
    operation: safeText(context.operation),
    online: context.online,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.error('[OpportunityPulse diagnostic]', event);
  }
}
