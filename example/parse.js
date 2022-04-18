const fs = require("fs/promises");
const path = require("path");
const jsYaml = require("js-yaml");
const { DocumentParser_OAS3_1, TypeStringGenerator } = require("../dist/main.js");
const { inspect } = require("util");
const { camelCase } = require("camel-case");

(async () => {

  const [docFilePath] = process.argv.slice(2);

  const raw = await fs.readFile(path.resolve(docFilePath));
  const doc = jsYaml.load(raw.toString());


  console.log("parse -------------------------------");
  const parsed = await new DocumentParser_OAS3_1(doc).parse();
  console.log(inspect(parsed, false, Infinity, true));

  console.log("schemas -------------------------------");
  const schemasGenerator = new TypeStringGenerator();
  let schemasString = "";
  for (const { name, ast } of parsed.schemas) {
    schemasString += `export type ${name} = ${schemasGenerator.generate(ast)};\n`;
  }
  await fs.writeFile(path.resolve(__dirname, "out/schemas.ts"), schemasString)

  console.log("paths -------------------------------");
  const operationsGenerator = new TypeStringGenerator({ refNamePrefix: "schemas." });
  let operationsString = "";
  operationsString += "import * as schemas from \"./schemas\";\n"
  operationsString += "import { JsonResponse, StatusResponse } from \"./types\";\n";
  operationsString += "\n";
  for (const op of parsed.operations) {
    const body = op.requestBody?.find((b) => b.mediaType === "application/json")
    const responses = op.responses.map((r) => {
      if (r.mediaType === "application/json") {
        return `JsonResponse<${r.status}, ${operationsGenerator.generate(r.schema)}>`
      } else {
        return `StatusResponse<${r.status}, ${operationsGenerator.generate(r.schema)}>`
      }
    })

    operationsString += `export namespace ${camelCase(op.operationId)} {\n`;
    operationsString += `  export const method = ${JSON.stringify(op.method)};\n`;
    operationsString += `  export const path = ${JSON.stringify(op.path)};\n`;
    operationsString += `  export type Params = ${op.pathParameters ? operationsGenerator.generate(op.pathParameters) : "void"};\n`;
    operationsString += `  export type Query = ${op.queryParameters ? operationsGenerator.generate(op.queryParameters) : "void"};\n`;
    operationsString += `  export type Body = ${body ? operationsGenerator.generate(body.schema) : "void"};\n`;
    operationsString += `  export type Response = ${responses.join(" | ") || "void"};\n`;
    operationsString += `}\n\n`;
  }
  await fs.writeFile(path.resolve(__dirname, "out/operations.ts"), operationsString);
})();
