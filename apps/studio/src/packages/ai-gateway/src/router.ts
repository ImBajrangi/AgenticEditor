import {
  IAIGatewayProvider,
  RoutingPolicy,
  AIRequestOptions,
  AIStructuredRequestOptions,
  AIToolCallRequest,
  AIToolCallResponse,
  ModelCapability,
} from "./types";
import { GeminiProvider } from "./gemini";
import { LocalModelProvider } from "./local";

export class IntelligentModelRouter implements IAIGatewayProvider {
  public id = "intelligent_router";
  public name = "Adaptive Multi-Provider Router";
  public isLocal = false;

  private cloudProvider: IAIGatewayProvider;
  private localProvider: IAIGatewayProvider;
  private policy: RoutingPolicy;

  constructor(
    policy: RoutingPolicy = { mode: "AUTO", allowCloudFallback: true },
    cloud?: IAIGatewayProvider,
    local?: IAIGatewayProvider
  ) {
    this.policy = policy;
    this.cloudProvider = cloud || new GeminiProvider();
    this.localProvider = local || new LocalModelProvider();
  }

  public setPolicy(policy: Partial<RoutingPolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }

  public getProviderForCapability(capability?: ModelCapability): IAIGatewayProvider {
    if (!capability) return this.cloudProvider;
    switch (capability) {
      case "VISION_FAST":
      case "VISION_HIGH_QUALITY":
      case "REASONING_DEEP":
      case "CREATIVE_REVIEW":
        return this.cloudProvider;
      case "REASONING_FAST":
      case "EDITORIAL_COMPARISON":
      case "AUDIO_REASONING":
      case "EMBEDDING":
      case "SPEECH":
        return this.policy.mode === "LOCAL" ? this.localProvider : this.cloudProvider;
      default:
        return this.cloudProvider;
    }
  }

  private async pickProvider(capability?: ModelCapability): Promise<IAIGatewayProvider> {
    if (capability && this.policy.mode === "AUTO") {
      return this.getProviderForCapability(capability);
    }

    switch (this.policy.mode) {
      case "LOCAL":
        return this.localProvider;
      case "CLOUD":
        return this.cloudProvider;
      case "PREFER_LOCAL": {
        const localHealth = await this.localProvider.healthCheck();
        if (localHealth.healthy || !this.policy.allowCloudFallback) {
          return this.localProvider;
        }
        return this.cloudProvider;
      }
      case "PREFER_CLOUD": {
        const cloudHealth = await this.cloudProvider.healthCheck();
        if (cloudHealth.healthy) {
          return this.cloudProvider;
        }
        return this.localProvider;
      }
      case "AUTO":
      default: {
        return this.cloudProvider;
      }
    }
  }

  public async generateText(
    request: AIRequestOptions
  ): Promise<{ text: string; latencyMs: number }> {
    const provider = await this.pickProvider(request.capability);
    try {
      return await provider.generateText(request);
    } catch (err) {
      if (provider === this.cloudProvider && this.policy.allowCloudFallback) {
        return await this.localProvider.generateText(request);
      }
      throw err;
    }
  }

  public async generateStructured<T>(
    request: AIStructuredRequestOptions<T>
  ): Promise<{ data: T; latencyMs: number }> {
    const provider = await this.pickProvider(request.capability);
    try {
      return await provider.generateStructured<T>(request);
    } catch (err) {
      if (provider === this.cloudProvider && this.policy.allowCloudFallback) {
        return await this.localProvider.generateStructured<T>(request);
      }
      throw err;
    }
  }

  public async callTools(request: AIToolCallRequest): Promise<AIToolCallResponse> {
    const provider = await this.pickProvider(request.capability);
    try {
      return await provider.callTools(request);
    } catch (err) {
      if (provider === this.cloudProvider && this.policy.allowCloudFallback) {
        return await this.localProvider.callTools(request);
      }
      throw err;
    }
  }

  public async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const cloud = await this.cloudProvider.healthCheck();
    const local = await this.localProvider.healthCheck();
    return {
      healthy: cloud.healthy || local.healthy,
      latencyMs: Math.min(cloud.latencyMs, local.latencyMs),
    };
  }
}
