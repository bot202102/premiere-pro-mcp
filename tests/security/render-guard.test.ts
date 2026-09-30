import { describe, expect, it, vi } from "vitest";
import { RenderAttemptGuard, wrapWithRenderGuard } from "../../src/security/render-guard.js";

describe("SEC FORK render circuit breaker", () => {
  it("counts only render tools, not other failures", () => {
    const guard = new RenderAttemptGuard({ PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS: "2" });
    guard.record("save_project", { success: false });
    guard.record("import_media", { success: false });
    expect(guard.allows("export_sequence")).toBe(true);
  });

  it("trips after the configured number of failed render attempts", () => {
    const guard = new RenderAttemptGuard({ PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS: "2" });
    guard.record("export_sequence", { success: false });
    expect(guard.allows("export_sequence")).toBe(true);
    guard.record("export_frame", { success: false });
    expect(guard.allows("export_sequence")).toBe(false);
    expect(guard.allows("add_to_render_queue")).toBe(false);
    expect(guard.allows("save_project")).toBe(true);
    expect(guard.blockedMessage("export_sequence")).toContain("circuit breaker");
    expect(guard.blockedMessage("export_sequence")).toContain("NOT sent to Premiere");
  });

  it("resets the counter after a successful render", () => {
    const guard = new RenderAttemptGuard({ PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS: "2" });
    guard.record("export_sequence", { success: false });
    guard.record("export_sequence", { success: false });
    expect(guard.allows("export_sequence")).toBe(false);
    guard.record("export_sequence", { success: true });
    expect(guard.allows("export_sequence")).toBe(true);
  });

  it("defaults to enabled with a limit of 2 and can be disabled", () => {
    const guard = new RenderAttemptGuard({});
    expect(guard.enabled).toBe(true);
    expect(guard.maxAttempts).toBe(2);
    const off = new RenderAttemptGuard({ PREMIERE_MCP_SEC_RENDER_GUARD: "0", PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS: "1" });
    off.record("export_sequence", { success: false });
    off.record("export_sequence", { success: false });
    expect(off.allows("export_sequence")).toBe(true);
  });

  it("wrapper blocks without calling the handler once tripped", async () => {
    const guard = new RenderAttemptGuard({ PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS: "1" });
    const handler = vi.fn(async () => ({ success: false as const, error: "boom" }));
    const wrapped = wrapWithRenderGuard("export_sequence", handler, guard);
    const first = await wrapped({});
    expect(first.success).toBe(false);
    expect(handler).toHaveBeenCalledOnce();
    const second = await wrapped({});
    expect((second as { error?: string }).error).toContain("circuit breaker");
    expect(handler).toHaveBeenCalledOnce();
  });
});
