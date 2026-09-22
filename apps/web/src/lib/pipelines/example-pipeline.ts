/**
 * @file apps/web/src/lib/pipelines/example-pipeline.ts
 * @description Layer 3: Domain / Pipelines - Application Health Check Pipeline.
 * Encapsulates multi-step validation logic for application environment and API connectivity.
 */

import { getApiBaseUrl } from "../infrastructure/api-client";

/**
 * Pipeline execution context contract.
 */
export interface HealthPipelineContext {
  /** Timestamp when pipeline started */
  startedAt: number;
  /** Resolved API endpoint base URL */
  apiEndpoint: string;
  /** Active execution environment identifier */
  environment: string;
}

/**
 * Pipeline execution result contract.
 */
export interface HealthPipelineResult {
  /** Indicates whether the health verification succeeded */
  success: boolean;
  /** Pipeline execution context snapshot */
  context: HealthPipelineContext;
  /** Error message if pipeline failed */
  error?: string;
}

/**
 * Executes the starter domain health check pipeline for application runtime readiness.
 *
 * @returns {Promise<HealthPipelineResult>} The pipeline result and diagnostic metadata.
 */
export async function executeHealthPipeline(): Promise<HealthPipelineResult> {
  // Step 1: Initialize pipeline execution context
  const context: HealthPipelineContext = {
    startedAt: Date.now(),
    apiEndpoint: getApiBaseUrl(),
    environment: process.env.NODE_ENV || "development",
  };

  try {
    // Step 2: Validate API endpoint is non-empty and well-formed
    if (!context.apiEndpoint.startsWith("http://") && !context.apiEndpoint.startsWith("https://")) {
      throw new Error(`Invalid API endpoint URL: ${context.apiEndpoint}`);
    }

    // Step 3: Return verified success result
    return {
      success: true,
      context,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error in health pipeline";
    return {
      success: false,
      context,
      error: message,
    };
  }
}
