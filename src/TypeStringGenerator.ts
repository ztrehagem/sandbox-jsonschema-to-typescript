import { SchemaAst } from "./ast";

export type Options = {
  refNamePrefix: string
}

export class TypeStringGenerator {
  readonly options: Options

  constructor(options: Partial<Options> = {}) {
    this.options = {
      refNamePrefix: options.refNamePrefix ?? ""
    }
  }

  generate(ast: SchemaAst): string {
    if (ast.type === "ref") {
      return `${this.options.refNamePrefix}${ast.name}`
    }

    if (ast.type === "atom") {
      return ast.name
    }

    if (ast.type === "intersection") {
      return ast.children.map((s) => this.generate(s)).join(" & ")
    }

    if (ast.type === "union") {
      return ast.children.map((s) => this.generate(s)).join(" | ")
    }

    if (ast.type === "enum") {
      return ast.cases.join(" | ")
    }

    if (ast.type === "array") {
      return `Array<${this.generate(ast.child)}>`
    }

    if (ast.type === "object") {
      const props = ast.properties.map((property) => {
        const name = JSON.stringify(property.name);
        const optional = property.required ? "": "?";
        const type = this.generate(property.schema);
        return `${name}${optional}: ${type};`
      });
      return `{ ${props.join(" ")} }`
    }

    const _: never = ast

    return "unknown"
  }
}
