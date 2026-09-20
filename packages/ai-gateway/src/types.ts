export type ModelCapability =
  | "VISION_FAST"
  | "VISION_HIGH_QUALITY"
  | "SPEECH"
  | "EMBEDDING"
  | "REASONING_FAST"
  | "REASONING_DEEP"
  | "EDITORIAL_COMPARISON"
  | "AUDIO_REASONING"
  | "CREATIVE_REVIEW";

export interface AIRequestOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  capability?: ModelCapability;
  mediaUrls?: string[];
  frames?: string[];
}

export interface AIStructuredRequestOptions<T = unknown> extends AIRequestOptions {
  schemaDescription: string;
  exampleResponse?: T;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AIToolCallRequest extends AIRequestOptions {
  tools: AIToolDefinition[];
}

export interface AIToolCallResponse {
  content?: string;
  toolCalls: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

export interface IAIGatewayProvider {
  id: string;
  name: string;
  isLocal: boolean;
  supportedCapabilities?: ModelCapability[];
  generateText(request: AIRequestOptions): Promise<{ text: string; latencyMs: number }>;
  generateStructured<T>(request: AIStructuredRequestOptions<T>): Promise<{ data: T; latencyMs: number }>;
  callTools(request: AIToolCallRequest): Promise<AIToolCallResponse>;
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}

export type RoutingPolicyMode = "AUTO" | "CLOUD" | "LOCAL" | "PREFER_LOCAL" | "PREFER_CLOUD";

export interface RoutingPolicy {
  mode: RoutingPolicyMode;
  maxLatencyMs?: number;
  allowCloudFallback: boolean;
}
