const fs = require("fs");
const path = require("path");
const jsYaml = require("js-yaml");
const jsonSchemaToTypeScript = require("json-schema-to-typescript");

const apiDocRaw = fs.readFileSync(path.resolve("assets/api.yaml")).toString()
const apiDoc = jsYaml.load(apiDocRaw);

const schemasEntries = Object.entries(apiDoc.components?.schemas ?? {})

const declPromises = schemasEntries.map(async ([name, schema]) => {
  // stringify する JSON Schema 本体に、dereference 用の components プロパティをそのままくっつける
  const parsable = { ...schema, components: apiDoc.components };
  const schemaName = schema.title ?? name

  return await jsonSchemaToTypeScript.compile(parsable, schemaName, {
    bannerComment: "",
    declareExternallyReferenced: false,
  });
})

Promise.all(declPromises).then((decls) => {
  const outDirPath = path.resolve("out")
  fs.mkdirSync(outDirPath, { recursive: true })
  const outPath = path.join(outDirPath, "models.ts");
  fs.writeFileSync(outPath, decls.join("\n"));
})
