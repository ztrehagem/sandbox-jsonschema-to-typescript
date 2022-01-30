import { OpenAPIV3_1 as oa } from "openapi-types";

export namespace intermediate {
  export type SchemaType =
    | "array"
    | "object"
    | "ref"
    | "union"
    | "intersection"
    | "enum";

  export interface PrimitiveSchema {
    type: "unknown" | "null" | "boolean" | "number" | "string";
  }

  export interface CompositeSchema {
    type: "union" | "intersection";
    schemas: Schema[];
  }

  export interface EnumSchema {
    type: "enum";
    cases: string[];
  }

  export interface RefSchema {
    type: "ref";
    name: string;
  }

  export interface ObjectSchema {
    type: "object";
    properties: ObjectProperty[];
  }

  export interface ArraySchema {
    type: "array";
    items: Schema;
  }

  export type Schema =
    | PrimitiveSchema
    | CompositeSchema
    | EnumSchema
    | RefSchema
    | ObjectSchema
    | ArraySchema;

  export interface ObjectProperty {
    name: string;
    required: boolean;
    writeOnly: boolean;
    readOnly: boolean;
    schema: Schema;
  }
}

export type ParseResult = { schemas: intermediate.Schema[] };

export function parse(doc: oa.Document) {
  const rawSchemas = doc.components?.schemas ?? {};
  const schemas = Object.entries(rawSchemas).map(([key, schema]) => ({
    name: key,
    schema: parseSchemaObject(schema),
  }));

  // TODO: parse paths

  return { schemas };
}

function parseSchemaObject(raw: oa.SchemaObject): intermediate.Schema {
  if (raw.allOf) {
    return {
      type: "intersection",
      schemas: raw.allOf.map(parseSchemaObjectOrReferenceObject),
    };
  }

  if (raw.anyOf) {
    return {
      type: "union",
      schemas: raw.anyOf.map(parseSchemaObjectOrReferenceObject),
    };
  }

  if (raw.oneOf) {
    return {
      type: "union",
      schemas: raw.oneOf.map(parseSchemaObjectOrReferenceObject),
    };
  }

  if (raw.enum) {
    return { type: "enum", cases: raw.enum };
  }

  if (Array.isArray(raw.type)) {
    const schemas = raw.type.map<intermediate.Schema>((typeName) => {
      if (typeName === "array" && "items" in raw && raw.items) {
        return parseSchemaObject({ ...raw, type: "array", items: raw.items });
      }

      switch (typeName) {
        case "object":
          return parseSchemaObject({ ...raw, type: "object" });

        case "array":
          return { type: "array", items: { type: "unknown" } };

        case "integer":
        case "number":
          return { type: "number" };

        case "string":
        case "boolean":
        case "null":
          return { type: typeName };

        default:
          const _: never = typeName;
          console.debug("parseSchemaObject:Array.isArray", raw);
          throw new Error("Runtime Error");
      }
    });

    return { type: "union", schemas: schemas };
  }

  switch (raw.type) {
    case "object":
      return {
        type: "object",
        properties: Object.entries(raw.properties ?? {}).map(
          ([name, schema]) => {
            return {
              name,
              required: raw.required?.includes(name) ?? false,
              readOnly: isReadOnlyProperty(schema),
              writeOnly: isWriteOnlyProperty(schema),
              schema: parseSchemaObjectOrReferenceObject(schema),
            };
          }
        ),
      };

    case "array":
      return {
        type: "array",
        items: parseSchemaObjectOrReferenceObject(raw.items),
      };

    case "string":
      return { type: "string" };

    case "integer":
    case "number":
      return { type: "number" };

    case "boolean":
      return { type: "boolean" };

    case "null":
      return { type: "null" };

    default:
      const _: undefined = raw.type;
      return { type: "unknown" };
  }
}

function parseReferenceObject(raw: oa.ReferenceObject): intermediate.Schema {
  if (!raw.$ref.startsWith("#")) {
    throw new Error(`"$ref" path starts with "#" is not supported.`);
  }
  const ret: intermediate.RefSchema = {
    type: "ref",
    name: raw.$ref.split("/").slice(-1)[0],
  };
  return ret;
}

function parseSchemaObjectOrReferenceObject(
  raw: oa.SchemaObject | oa.ReferenceObject
): intermediate.Schema {
  if ("$ref" in raw) {
    return parseReferenceObject(raw);
  } else {
    return parseSchemaObject(raw);
  }
}

function isReadOnlyProperty(schema: oa.SchemaObject): boolean {
  return "readOnly" in schema
    ? schema.readOnly ?? false
    : "allOf" in schema
    ? schema.allOf?.some(
        (childSchema) =>
          ("readOnly" in childSchema && childSchema.readOnly) ?? false
      ) ?? false
    : false;
}

function isWriteOnlyProperty(schema: oa.SchemaObject): boolean {
  return "writeOnly" in schema
    ? schema.writeOnly ?? false
    : "allOf" in schema
    ? schema.allOf?.some(
        (childSchema) =>
          ("writeOnly" in childSchema && childSchema.writeOnly) ?? false
      ) ?? false
    : false;
}
