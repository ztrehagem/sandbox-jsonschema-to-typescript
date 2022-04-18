import { camelCase } from "camel-case";
import { OpenAPIV3_1 as oa } from "openapi-types";
import { ast, SchemaAst } from "./ast";
import { SchemaObjectParserOAS3_1 } from "./SchemaObjectParser_OAS3_1";

export type OperationId = string
export type MimeType = string
export type ParsedRequestBody = { mediaType: string, schema: SchemaAst }
export type ParsedResponse = { status: string, mediaType: string, schema: SchemaAst }
export type ParsedOperation = {
  operationId: string
  path: string
  method: string
  pathParameters: ast.Object | null
  queryParameters: ast.Object | null
  requestBody: ParsedRequestBody[] | null
  responses: ParsedResponse[]
}

const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

export class PathsParser_OAS3_1 {
  protected readonly unref: <T>(ref: string) => T

  constructor(unref: <T>(ref: string) => T) {
    this.unref = unref
  }

  parse(paths: oa.PathsObject): ParsedOperation[] {
    const entries = Object.entries(paths).flatMap(([path, pathObject]) =>
      httpMethods.flatMap((method) => {
        const operationObject = pathObject?.[method]
        return operationObject ? { path, pathObject, method, operationObject } : []
      })
    )

    const parsed: ParsedOperation[] = []

    for (const { path, pathObject, method, operationObject } of entries) {
      parsed.push(this.parseOperation(path, pathObject, method, operationObject))
    }

    return parsed
  }

  protected parseOperation(path: string, pathObject: oa.PathItemObject, method: string, operationObject: oa.OperationObject): ParsedOperation {
    const operationId = operationObject.operationId ?? this.getFallbackOperationId(method, path)

    const dereferencedParameters = [...pathObject.parameters ?? [], ...operationObject.parameters ?? []]?.map((o) => "$ref" in o ? this.unref<oa.ParameterObject>(o.$ref) : o)
    const pathParameters = dereferencedParameters.filter((o) => o.in === "path")
    const queryParameters = dereferencedParameters.filter((o) => o.in === "query")

    const parsedPathParameters = pathParameters.length ? this.parseParameters(pathParameters) : null
    const parsedQueryParameters = queryParameters.length ? this.parseParameters(queryParameters) : null

    const requestBody = operationObject.requestBody
    const dereferencedRequestBody = requestBody && "$ref" in requestBody ? this.unref<oa.RequestBodyObject>(requestBody.$ref) : requestBody
    const parsedRequestBody = dereferencedRequestBody ? this.parseRequestBody(dereferencedRequestBody) : null

    const responses = operationObject.responses ?? {}
    const parsedResponses = this.parseResponses(responses)

    return {
      operationId,
      path,
      method,
      pathParameters: parsedPathParameters,
      queryParameters: parsedQueryParameters,
      requestBody: parsedRequestBody,
      responses: parsedResponses,
    }
  }

  protected getFallbackOperationId(method: string, path: string): string {
    return camelCase(method + "_" + path.replaceAll(/[^\w\d]/gi, "_"))
  }

  protected parseParameters(raw: oa.ParameterObject[]): ast.Object {
    const parser = new SchemaObjectParserOAS3_1()

    const properties: ast.Property[] = raw.map((o) => ({
      name: o.name,
      required: o.required ?? false,
      schema: parser.parse(o.schema)
    }))

    return { type: "object", properties }
  }

  protected parseRequestBody(raw: oa.RequestBodyObject): ParsedRequestBody[] {
    const parser = new SchemaObjectParserOAS3_1()

    return Object.entries(raw.content)
      .map(([mediaType, mediaTypeObject]) => ({
        mediaType,
        schema: parser.parse(mediaTypeObject.schema)
      }))
  }

  protected parseResponses(raw: oa.ResponsesObject): ParsedResponse[] {
    const parser = new SchemaObjectParserOAS3_1()
    const entries = Object.entries(raw)
    const dereferences = entries.map(([status, o]) => ({ status, responseObject: "$ref" in o ? this.unref<oa.ResponseObject>(o.$ref) : o }))
    const flatten = dereferences.flatMap(({ status, responseObject }) => {
      const mediaTypes = Object.entries(responseObject.content ?? {})
      return mediaTypes.map(([mediaType, mediaTypeObject]) => ({
        status,
        mediaType,
        mediaTypeObject,
      }))
    })

    return flatten.map(({ status, mediaType, mediaTypeObject }) => ({
      status,
      mediaType,
      schema: parser.parse(mediaTypeObject.schema),
    }))
  }
}
