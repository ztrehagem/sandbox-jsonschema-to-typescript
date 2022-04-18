import { OpenAPIV3_1 as oa } from "openapi-types";
import { PathsParser_OAS3_1 } from "./PathsParser_OAS3_1";
import { SchemasParser_OAS3_1 } from "./SchemasParser_OAS3_1";

export class DocumentParser_OAS3_1 {
  readonly document: oa.Document

  constructor(document: oa.Document) {
    this.document = document
  }

  protected unref<T>(refString: string): T {
    if (!refString.startsWith("#/")) {
      throw new Error("invalid ref string")
    }
    const keys = refString.slice(2).split("/")
    let target: any = this.document
    for (const key of keys) {
      target = target[key]
    }
    return target
  }

  async parse() {
    const schemasParser = new SchemasParser_OAS3_1()
    const parsedSchemas = schemasParser.parse(this.document.components?.schemas ?? {})

    const pathsParser = new PathsParser_OAS3_1((ref) => this.unref(ref))
    const parsedOperations = pathsParser.parse(this.document.paths ?? {})

    return {
      schemas: parsedSchemas,
      operations: parsedOperations,
    }
  }
}
