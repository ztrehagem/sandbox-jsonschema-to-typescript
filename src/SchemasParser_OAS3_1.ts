import { OpenAPIV3_1 as oa } from "openapi-types";
import { SchemaAst } from "./ast";
import { SchemaObjectParserOAS3_1 } from "./SchemaObjectParser_OAS3_1";

export type ParsedSchema = {
  name: string
  ast: SchemaAst
}

export class SchemasParser_OAS3_1 {
  parse(schemas: Record<string, oa.SchemaObject>): ParsedSchema[] {
    const parser = new SchemaObjectParserOAS3_1();

    return Object.entries(schemas ?? {}).map(([name, schema]) => ({
      name,
      ast: parser.parse(schema),
    }));
  }
}
