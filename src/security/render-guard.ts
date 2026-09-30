/**
 * SEC FORK: per-session circuit breaker for render/export tools.
 *
 * An agent hammering a wedged export module can leave the Premiere UI
 * half-hung (observed on Premiere 26.5.2 / Windows: four render paths each
 * failing with "Unable to initialize export" / "Unknown Error" while
 * validate_project_for_export still reported the sequence ready). After N
 * failed render attempts in this server session, further render attempts are
 * refused with an honest error until the server restarts or the limit is
 * raised. Any successful render resets the counter.
 *
 * Disable entirely with PREMIERE_MCP_SEC_RENDER_GUARD=0; tune the limit with
 * PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS (default 2). Note: in the HTTP
 * transport a new server instance (and therefore a fresh guard) is created
 * per request, so the breaker is meaningful for the stdio session.
 */

const RENDER_TOOL_NAMES = new Set([
  "export_sequence",
  "export_frame",
  "export_sequence_review_frames",
  "export_sequence_marker_review_frames",
  "export_sequence_clip_review_frames",
  "add_to_render_queue",
  "encode_project_item",
  "encode_file",
]);

export class RenderAttemptGuard {
  readonly enabled: boolean;
  readonly maxAttempts: number;
  private failedAttempts = 0;

  constructor(env: Record<string, string | undefined> = process.env) {
    this.enabled = (env.PREMIERE_MCP_SEC_RENDER_GUARD ?? "1") !== "0";
    const parsed = Number.parseInt(env.PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS ?? "2", 10);
    this.maxAttempts = Number.isInteger(parsed) && parsed > 0 ? parsed : 2;
  }

  allows(toolName: string): boolean {
    if (!this.enabled || !RENDER_TOOL_NAMES.has(toolName)) return true;
    return this.failedAttempts < this.maxAttempts;
  }

  record(toolName: string, result: { success?: boolean } | undefined | null): void {
    if (!this.enabled || !RENDER_TOOL_NAMES.has(toolName)) return;
    if (typeof result?.success !== "boolean") return;
    if (result.success) this.failedAttempts = 0;
    else this.failedAttempts += 1;
  }

  blockedMessage(toolName: string): string {
    return `SEC FORK: render circuit breaker — ${this.failedAttempts} failed render attempt(s) this session (limit ${this.maxAttempts}). ${toolName} was NOT sent to Premiere. Restart the MCP server to reset the counter, raise PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS, or render from the Premiere UI.`;
  }
}

export function wrapWithRenderGuard<TArgs, TResult extends { success?: boolean; error?: string }>(
  toolName: string,
  handler: (args: TArgs) => Promise<TResult>,
  guard: RenderAttemptGuard,
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    if (!guard.allows(toolName)) {
      return { success: false, error: guard.blockedMessage(toolName) } as TResult;
    }
    const result = await handler(args);
    guard.record(toolName, result);
    return result;
  };
}
