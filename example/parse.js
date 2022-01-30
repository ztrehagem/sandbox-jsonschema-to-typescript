const fs = require("fs");
const path = require("path");
const jsYaml = require("js-yaml");
const { parse } = require("../dist/main.js");
const { inspect } = require("util");

const [docFilePath] = process.argv.slice(2);

const raw = fs.readFileSync(path.resolve(docFilePath));
const doc = jsYaml.load(raw.toString());

const parsed = parse(doc);

console.log(inspect(parsed, false, Infinity, true));
