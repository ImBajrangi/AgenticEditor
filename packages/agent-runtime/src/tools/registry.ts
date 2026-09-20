import { AgentTool, AgentToolContext } from "../types";
import { SilenceDetectorTool, SilenceRange } from "./silence-detector";
import { TimelineMutationOp } from "@aetheredit/timeline-ir";

export class AgentToolRegistry {
  private tools = new Map<string, AgentTool>();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool<TInput, TOutput>(tool: AgentTool<TInput, TOutput>): void {
    this.tools.set(tool.name, tool as AgentTool);
  }

  public getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  public getAllDeclarations(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.schema,
    }));
  }

  public async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: AgentToolContext
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' is not registered in AgentToolRegistry.`);
    }

    if (tool.schema && Array.isArray(tool.schema.required)) {
      for (const reqField of tool.schema.required) {
        if (args[reqField] === undefined || args[reqField] === null) {
          throw new Error(`Missing required parameter '${reqField}' for tool '${name}'.`);
        }
      }
    }

    context.emitEvent("TOOL_STARTED", { toolName: name, args });
    try {
      const result = await tool.execute(args, context);
      context.emitEvent("TOOL_COMPLETED", { toolName: name, result });
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      context.emitEvent("TOOL_COMPLETED", { toolName: name, error: errorMsg });
      throw err;
    }
  }

  private registerDefaultTools(): void {
    // 1. Detect Silence Tool
    this.registerTool<{ mediaPath: string; minSilenceDurationSec?: number }, { silences: SilenceRange[]; count: number }>({
      name: "detect_silence",
      description: "Scans audio in a media file to detect silence ranges exceeding the minimum duration threshold.",
      schema: {
        type: "object",
        properties: {
          mediaPath: { type: "string", description: "Path to audio/video file" },
          minSilenceDurationSec: { type: "number", description: "Minimum silence duration in seconds (default 0.4)" },
        },
        required: ["mediaPath"],
      },
      execute: async (input, ctx) => {
        const silences = await SilenceDetectorTool.detect(
          input.mediaPath,
          input.minSilenceDurationSec || 0.4
        );
        return { silences, count: silences.length };
      },
    });

    // 2. Apply Timeline Cut Tool
    this.registerTool<{ trackId: string; clipId: string; splitFrame: number }, { success: boolean; mutation: TimelineMutationOp }>({
      name: "apply_timeline_cut",
      description: "Splits a timeline clip at a designated frame number to remove pauses or create editorial cuts.",
      schema: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          clipId: { type: "string" },
          splitFrame: { type: "number" },
        },
        required: ["trackId", "clipId", "splitFrame"],
      },
      execute: async (input, ctx) => {
        const mutation: TimelineMutationOp = {
          type: "SPLIT_CLIP",
          trackId: input.trackId,
          clipId: input.clipId,
          splitFrame: input.splitFrame,
        };
        ctx.emitEvent("TIMELINE_MUTATION", { mutation });
        return { success: true, mutation };
      },
    });

    // 3. Apply Color Grade Tool
    this.registerTool<{ trackId: string; clipId: string; lutName: string; intensity?: number }, { success: boolean; mutation: TimelineMutationOp }>({
      name: "apply_color_grade",
      description: "Applies a cinematic 3D LUT color grading profile to a timeline clip.",
      schema: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          clipId: { type: "string" },
          lutName: { type: "string" },
          intensity: { type: "number" },
        },
        required: ["trackId", "clipId", "lutName"],
      },
      execute: async (input, ctx) => {
        const mutation: TimelineMutationOp = {
          type: "APPLY_CLIP_EFFECT",
          trackId: input.trackId,
          clipId: input.clipId,
          effect: {
            id: `fx_lut_${Date.now()}`,
            pluginId: "builtin_lut_mapping",
            enabled: true,
            parameters: { lut: input.lutName, intensity: input.intensity ?? 0.85 },
          },
        };
        ctx.emitEvent("TIMELINE_MUTATION", { mutation });
        return { success: true, mutation };
      },
    });

    // 4. Request Human Approval Tool
    this.registerTool<{ prompt: string }, { suspended: boolean }>({
      name: "request_human_approval",
      description: "Suspends the agent run and prompts the creative director for explicit review before proceeding.",
      schema: {
        type: "object",
        properties: {
          prompt: { type: "string" },
        },
        required: ["prompt"],
      },
      execute: async (input, ctx) => {
        ctx.emitEvent("WAITING_FOR_APPROVAL", { prompt: input.prompt });
        return { suspended: true };
      },
    });
  }
}
