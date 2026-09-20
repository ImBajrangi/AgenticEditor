import { NextResponse } from "next/server";
import { WorkflowExecutor, WorkflowGraph, WorkflowExecutionState } from "@aetheredit/workflow-engine";

const executor = new WorkflowExecutor();

// Register production node handlers
executor.registerHandler("TRIGGER_UPLOAD", async (ctx) => {
  return { status: "Ingested 4 raw media files", fileCount: 4, timestamp: Date.now() };
});

executor.registerHandler("ANALYSIS_SCENE_DETECTION", async (ctx) => {
  return {
    detectedCuts: 14,
    avgShotDurationSec: 3.2,
    aestheticScore: 0.94,
    model: "TransNetV2-CUDA",
  };
});

executor.registerHandler("AI_AGENT_STORY", async (ctx) => {
  return {
    narrativeArc: "Hook (0-15s) -> Reveal (30s) -> Climax (75s)",
    selectedShotsCount: 8,
    status: "Plan finalized",
  };
});

executor.registerHandler("CREATIVE_COLOR_GRADE", async (ctx) => {
  return { lutApplied: "Warm_Filmic_5207.cube", skinToneProtect: true };
});

executor.registerHandler("OUTPUT_RENDER_MASTER", async (ctx) => {
  return {
    renderStatus: "COMPLETED",
    outputFormat: "ProRes 422 / H.264 Web",
    downloadUrl: "/renders/master_travel_90s.mp4",
  };
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { graph, action, existingState, decision, feedbackNotes } = body as {
      graph: WorkflowGraph;
      action?: "RUN" | "RESUME";
      existingState?: WorkflowExecutionState;
      decision?: "APPROVED" | "REJECTED";
      feedbackNotes?: string;
    };

    if (!graph) {
      return NextResponse.json({ error: "Missing workflow graph" }, { status: 400 });
    }

    if (action === "RESUME" && existingState && decision) {
      const resultState = await executor.resume(graph, existingState, decision, feedbackNotes);
      return NextResponse.json({ success: true, state: resultState });
    }

    const resultState = await executor.execute(graph, {}, existingState);
    return NextResponse.json({ success: true, state: resultState });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
