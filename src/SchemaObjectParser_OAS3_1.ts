import { OpenAPIV3_1 as oa } from "openapi-types";
import { SchemaAst } from "./ast";

export class SchemaObjectParserOAS3_1 {
  parse(schema: oa.SchemaObject | oa.ReferenceObject | null | undefined): SchemaAst {
    if (!schema) {
      return { type: "atom", name: "void" }
    }

    if ("$ref" in schema) {
      return {
        type: "ref",
        url: schema.$ref,
        name: schema.$ref.split("/").pop()!,
      }
    }

    if (schema.allOf) {
      return { type: "intersection", children: schema.allOf.map((s) => this.parse(s)) }
    }

    if (schema.oneOf) {
      return { type: "union", children: schema.oneOf.map((s) => this.parse(s)) }
    }

    if (schema.anyOf) {
      return { type: "union", children: schema.anyOf.map((s) => this.parse(s)) }
    }

    if (Array.isArray(schema.type)) {
      return { type: "union", children: schema.type.map((type) => this.parse({ ...schema, type } as oa.SchemaObject)) }
    }

    if (schema.type === "null") {
      return { type: "atom", name: "null" }
    }

    if (schema.type === "boolean") {
      return { type: "atom", name: "boolean" }
    }

    if (schema.type === "integer" || schema.type === "number") {
      if (schema.enum) {
        return { type: "enum", cases: schema.enum }
      } else {
        return { type: "atom", name: "number" }
      }
    }

    if (schema.type === "string") {
      if (schema.enum) {
        return { type: "enum", cases: schema.enum.map((e) => JSON.stringify(e)) }
      } else {
        return { type: "atom", name: "string" }
      }
    }

    if (schema.type === "array") {
      if (schema.items) {
        return { type: "array", child: this.parse(schema.items) }
      } else {
        return { type: "array", child: { type: "atom", name: "unknown" } }
      }
    }

    if (schema.type === "object") {
      if (schema.properties) {
        return {
          type: "object",
          properties: Object.entries(schema.properties).map(([name, childSchema]) => ({
            name,
            schema: this.parse(childSchema),
            required: schema.required?.includes(name) ?? false,
          }))
        }
      } else {
        return { type: "atom", name: "object" }
      }
    }

    return { type: "atom", name: "unknown" }
  }
}
