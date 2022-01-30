import type { OpenAPI, OpenAPIV3_1 } from "openapi-types";
import { parse as parseOpenAPIV3_1 } from "./openapi3_1";

export function parse(doc: OpenAPI.Document) {
  const version = String((doc as any)?.openapi);

  if (!version.match(/^3\.1\.\d+$/)) {
    throw new Error(`OpenAPI ${version} is not supported.`);
  }

  return parseOpenAPIV3_1(doc as OpenAPIV3_1.Document);
}
