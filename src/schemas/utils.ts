/**
 * Schema conversion utilities
 */

import { z } from "zod";

/**
 * Convert Zod schema to JSON Schema for MCP
 * This is a simplified converter - for production use zod-to-json-schema library
 */
export function zodToJsonSchema(schema: z.ZodType): any {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value as z.ZodType);
      if (!(value as any).isOptional()) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (schema instanceof z.ZodString) {
    return {
      type: "string",
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodNumber) {
    return {
      type: "number",
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodBoolean) {
    return {
      type: "boolean",
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema(schema.element),
    };
  }

  if (schema instanceof z.ZodUnion) {
    return {
      anyOf: schema.options.map((option: any) => zodToJsonSchema(option)),
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
    return zodToJsonSchema(schema._def.innerType);
  }

  return { type: "string" };
}
