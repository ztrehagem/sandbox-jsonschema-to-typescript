export type SchemaAst = ast.Ref | ast.Atom | ast.Intersection | ast.Union | ast.Enum | ast.Array | ast.Object

export namespace ast {
  export interface Abstract {
    type: string
  }

  export interface Ref extends Abstract {
    type: "ref"
    url: string
    name: string
  }

  export interface Atom extends Abstract {
    type: "atom"
    name: "unknown" | "void" | "null" | "boolean" | "number" | "string" | "object"
  }

  export interface Intersection extends Abstract {
    type: "intersection"
    children: SchemaAst[]
  }

  export interface Union extends Abstract {
    type: "union"
    children: SchemaAst[]
  }

  export interface Enum extends Abstract {
    type: "enum"
    cases: string[]
  }

  export interface Array extends Abstract {
    type: "array"
    child: SchemaAst
  }

  export interface Object extends Abstract {
    type: "object"
    properties: Property[]
  }

  export interface Property {
    name: string
    schema: SchemaAst
    required: boolean
  }
}
