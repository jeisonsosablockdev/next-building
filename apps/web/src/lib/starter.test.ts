/**
 * @file apps/web/src/lib/starter.test.ts
 * @description Unit tests for starter utilities, API infrastructure, and pipeline execution.
 */

import { describe, test, expect } from "vitest";
import { cn, truncateMiddle } from "@/lib/utils";
import { getApiBaseUrl, getApiEndpointUrl } from "@/lib/infrastructure/api-client";
import { executeHealthPipeline } from "@/lib/pipelines/example-pipeline";

describe("Starter Utilities & Infrastructure", () => {
  describe("cn (class names)", () => {
    test("merges conditional class names correctly", () => {
      // Step 1: Arrange & Act
      const result = cn("base", true && "active", false && "hidden", undefined, null, "custom");

      // Step 2: Assert
      expect(result).toBe("base active custom");
    });
  });

  describe("truncateMiddle", () => {
    test("formats string into truncated middle representation", () => {
      // Step 1: Arrange
      const text = "0123456789abcdef";

      // Step 2: Act
      const formatted = truncateMiddle(text, 4);

      // Step 3: Assert
      expect(formatted).toBe("0123...cdef");
    });

    test("returns empty string or original if invalid or short", () => {
      // Step 1: Assert edge cases
      expect(truncateMiddle(null)).toBe("");
      expect(truncateMiddle("short")).toBe("short");
    });
  });

  describe("API Infrastructure", () => {
    test("returns default API base URL when not configured", () => {
      // Step 1: Act
      const url = getApiBaseUrl();

      // Step 2: Assert
      expect(url).toBe("http://localhost:3001");
    });

    test("generates correct absolute endpoint URL", () => {
      // Step 1: Act
      const endpoint = getApiEndpointUrl("/api/health");

      // Step 2: Assert
      expect(endpoint).toBe("http://localhost:3001/api/health");
    });
  });

  describe("Domain Pipeline", () => {
    test("executes application health pipeline successfully", async () => {
      // Step 1: Act
      const result = await executeHealthPipeline();

      // Step 2: Assert
      expect(result.success).toBe(true);
      expect(result.context.apiEndpoint).toBe("http://localhost:3001");
      expect(result.context.environment).toBeDefined();
    });
  });

  describe("Schema Validation (Zod & Valibot)", () => {
    test("validates schema with Zod v4", async () => {
      // Step 1: Arrange schema
      const { z } = await import("zod");
      const UserSchema = z.object({
        name: z.string(),
        endpoint: z.string().url(),
      });

      // Step 2: Act
      const parsed = UserSchema.parse({
        name: "Next.js Developer",
        endpoint: "http://localhost:3001",
      });

      // Step 3: Assert
      expect(parsed.name).toBe("Next.js Developer");
      expect(parsed.endpoint).toBe("http://localhost:3001");
    });

    test("validates schema with Valibot", async () => {
      // Step 1: Arrange schema
      const v = await import("valibot");
      const ConfigSchema = v.object({
        mode: v.string(),
        debug: v.boolean(),
      });

      // Step 2: Act
      const result = v.safeParse(ConfigSchema, {
        mode: "development",
        debug: true,
      });

      // Step 3: Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.mode).toBe("development");
      }
    });
  });
});
