import { describe, expect, it } from "vitest";
import { getDescribeToolTool } from "../src/tools/describe-tool.js";
import { TOOL_CONTRACT_NOTES, GLOBAL_CONTRACT_NOTES } from "../src/tools/contracts.js";

const fakeTools = {
  set_clip_volume: {
    name: "set_clip_volume",
    description: "Set clip volume.",
    parameters: { type: "object", properties: { node_id: { type: "string" }, volume_db: { type: "number", enum: [-24, 24] } }, required: ["node_id"] },
    annotations: { readOnlyHint: false },
  },
  describe_tool: { name: "describe_tool", parameters: {} },
};

describe("describe_tool (contratos self-describing)", () => {
  const tool = getDescribeToolTool(() => fakeTools).describe_tool;

  it("serves description, schema summary, and curated contract notes for a known tool", async () => {
    const result = await tool.handler({ tool_name: "set_clip_volume" });
    expect(result.success).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.description).toBe("Set clip volume.");
    expect((data.schemaSummary as Array<Record<string, unknown>>)[0]).toMatchObject({ field: "node_id", type: "string", required: true });
    expect(Array.isArray(data.contractNotes)).toBe(true);
    expect((data.contractNotes as string[]).join(" ")).toMatch(/localizados/i);
    expect((data.globalNotes as string[]).length).toBeGreaterThan(2);
  });

  it("returns an honest error with closest-match suggestions for an unknown tool", async () => {
    const result = await tool.handler({ tool_name: "set_clip_volum" });
    expect(result.success).toBe(false);
    expect(String((result as { error: string }).error)).toContain("2 tools are registered");
    expect(String((result as { error: string }).error)).toContain("set_clip_volume");
  });

  it("requires tool_name", async () => {
    const result = await tool.handler({});
    expect(result.success).toBe(false);
  });

  it("contract map covers the F-C hidden-semantics instances from QA rounds", () => {
    expect(TOOL_CONTRACT_NOTES.automate_effect_parameters_uxp.join(" ")).toMatch(/NORMALIZADOS.*0\.5 = 0 dB/s);
    expect(TOOL_CONTRACT_NOTES.capture_frame.join(" ")).toMatch(/CACHE por time_seconds/i);
    expect(TOOL_CONTRACT_NOTES.set_keyframe_interpolation.join(" ")).toMatch(/NO honra curvas/i);
    expect(GLOBAL_CONTRACT_NOTES.join(" ")).toMatch(/no son intercambiables/i);
  });
});
