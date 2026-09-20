import { NextResponse } from "next/server";
import { AgentRuntime } from "@aetheredit/agent-runtime";
import { TimelineIR } from "@aetheredit/timeline-ir";

// Global persistent agent runtime instance in memory
const runtime = new AgentRuntime();

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      projectId: string;
      prompt: string;
      timeline: TimelineIR;
      provider?: "AUTO" | "CLOUD" | "LOCAL";
      apiKey?: string;
      localEndpoint?: string;
    };

    if (!body.prompt || !body.timeline) {
      return NextResponse.json({ error: "Missing prompt or timeline" }, { status: 400 });
    }

    const run = await runtime.executeRun({
      projectId: body.projectId || "proj_default",
      prompt: body.prompt,
      timeline: body.timeline,
      provider: body.provider,
      apiKey: body.apiKey,
      localEndpoint: body.localEndpoint,
    });

    return NextResponse.json({
      success: run.status === "COMPLETED" || run.status === "WAITING_FOR_APPROVAL",
      run,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  const runs = runtime.getAllRuns();
  return NextResponse.json({ runs });
}
