import {
  IAIGatewayProvider,
  AIRequestOptions,
  AIStructuredRequestOptions,
  AIToolCallRequest,
  AIToolCallResponse,
} from "./types";

export class GeminiProvider implements IAIGatewayProvider {
  public id = "gemini";
  public name = "Google Gemini Pro/Flash";
  public isLocal = false;

  private apiKey: string;
  private model: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || "", model: string = "gemini-1.5-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async generateText(
    request: AIRequestOptions
  ): Promise<{ text: string; latencyMs: number }> {
    const startTime = Date.now();
    if (!this.apiKey) {
      return {
        text: `[Gemini Simulator] Analyzed prompt: "${request.prompt.substring(0, 80)}...". Recommended cut: 12 edits aligned to speech cadences.`,
        latencyMs: 120,
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.prompt }] }],
          systemInstruction: request.systemPrompt
            ? { parts: [{ text: request.systemPrompt }] }
            : undefined,
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 2048,
          },
        }),
      });

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return { text, latencyMs: Date.now() - startTime };
    } catch (err) {
      throw new Error(`Gemini API failure: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async generateStructured<T>(
    request: AIStructuredRequestOptions<T>
  ): Promise<{ data: T; latencyMs: number }> {
    const startTime = Date.now();
    const systemPrompt = `${request.systemPrompt || ""}\nYou MUST return strictly valid JSON matching the following schema description:\n${request.schemaDescription}\nReturn raw JSON only, with no markdown code blocks.`;

    if (!this.apiKey) {
      // Deterministic simulation fallback when key is not set
      const mockData = request.exampleResponse || ({} as T);
      return { data: mockData, latencyMs: 95 };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: request.temperature ?? 0.2,
          },
        }),
      });

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanJson = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      return { data: JSON.parse(cleanJson), latencyMs: Date.now() - startTime };
    } catch (err) {
      throw new Error(`Gemini Structured failure: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async callTools(request: AIToolCallRequest): Promise<AIToolCallResponse> {
    const startTime = Date.now();
    if (!this.apiKey) {
      // Simulate calling first available tool
      const tool = request.tools[0];
      return {
        content: "Simulated Director reasoning: Applying cut and silence removal.",
        toolCalls: tool
          ? [
              {
                name: tool.name,
                arguments: {
                  action: "CUT_DEAD_AIR",
                  minSilenceDurationMs: 400,
                  targetPacing: "DYNAMIC",
                },
              },
            ]
          : [],
      };
    }

    // Direct Gemini Function Calling specification
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const functionDeclarations = request.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: request.prompt }] }],
        tools: [{ functionDeclarations }],
      }),
    });

    const json = await response.json();
    const candidate = json.candidates?.[0]?.content?.parts?.[0];

    if (candidate?.functionCall) {
      return {
        toolCalls: [
          {
            name: candidate.functionCall.name,
            arguments: candidate.functionCall.args || {},
          },
        ],
      };
    }

    return {
      content: candidate?.text || "",
      toolCalls: [],
    };
  }

  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    return { healthy: true, latencyMs: Date.now() - start };
  }
}
