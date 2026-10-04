/**
 * SEC FORK (familia "contratos no self-describing"): `describe_tool` sirve, por
 * nombre, la descripción + inputSchema + notas de contrato aprendidas en QA
 * (semántica oculta, requerimientos encadenados, nombres localizados). Un
 * agente nuevo LEE el contrato en vez de TANTEAR — la palanca que cubre las
 * 480 tools de golpe.
 */
import { GLOBAL_CONTRACT_NOTES, TOOL_CONTRACT_NOTES } from "./contracts.js";

type ToolLike = {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
};

export function getDescribeToolTool(getTools: () => Record<string, ToolLike>) {
  return {
    describe_tool: {
      description:
        "Return the full self-describing contract for one tool: description, JSON input schema, annotations, curated contract notes (hidden semantics learned in QA: normalized values, caches, chained requirements, localized host names, id kinds) and the global contract notes. Use BEFORE calling a tool whose argument shapes or semantics you have not verified.",
      parameters: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          tool_name: { type: "string", minLength: 1, maxLength: 128 },
        },
        required: ["tool_name"],
      },
      annotations: { readOnlyHint: true },
      handler: async (args: { tool_name?: string }) => {
        const wanted = typeof args?.tool_name === "string" ? args.tool_name.trim() : "";
        if (!wanted) return { success: false, error: "tool_name is required" };
        const tools = getTools();
        const names = Object.keys(tools);
        const tool = tools[wanted];
        if (!tool) {
          const suggestions = names
            .filter((n) => n.includes(wanted.split("_")[0] ?? ""))
            .slice(0, 8);
          return {
            success: false,
            error:
              `Unknown tool '${wanted}'. ${names.length} tools are registered; closest matches: ` +
              (suggestions.length ? suggestions.join(", ") : names.slice(0, 8).join(", ") + " …"),
          };
        }
        const inputSchema = (tool.parameters as Record<string, unknown> | undefined) ?? {};
        const required = Array.isArray(inputSchema.required) ? (inputSchema.required as string[]) : [];
        const properties = (inputSchema.properties as Record<string, { type?: unknown; enum?: unknown[]; description?: string }> | undefined) ?? {};
        const schemaSummary = Object.entries(properties).map(([field, def]) => ({
          field,
          type: Array.isArray(def?.type) ? def.type.join("|") : def?.type,
          enum: Array.isArray(def?.enum) ? def.enum : undefined,
          required: required.includes(field),
          description: def?.description,
        }));
        return {
          success: true,
          data: {
            name: wanted,
            description: tool.description,
            annotations: tool.annotations,
            inputSchema,
            schemaSummary,
            contractNotes: TOOL_CONTRACT_NOTES[wanted] ?? [],
            globalNotes: GLOBAL_CONTRACT_NOTES,
          },
        };
      },
    },
  };
}
