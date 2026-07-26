import Ajv, { type ErrorObject } from "ajv";

import schema from "../color.schema.json";

/**
 * The shape of one token: what a name may look like, what a value may look
 * like, and that both modes are written. It knows nothing about how two tokens
 * relate — a hex declared twice, a palette entry nothing points at, a semantic
 * token leaning on another — which is lint.ts.
 *
 * It lives in a JSON Schema file rather than in code so the editor can read it
 * too. `color.yaml` names it in a yaml-language-server comment on its first
 * line, which puts a typo under a red line while it is being typed instead of
 * at the next build.
 */
const validate = new Ajv({ allErrors: true, verbose: true }).compile(schema);

/**
 * Which themes exist, read off the schema so the list is written once rather
 * than kept in step with it. Adding one is a schema edit and every mode-shaped
 * type follows from it.
 */
export type Mode = keyof typeof schema.definitions.values.properties;

/** ajv's terse output, said the way the rest of the build says things. */
function describe(error: ErrorObject) {
  const { instancePath, keyword, params, data, message } = error;
  // "/$color.ansi.red/values/theme-dark" -> ["$color.ansi.red", "values", "theme-dark"]
  const [name, , mode] = instancePath.split("/").filter(Boolean);
  const depth = instancePath.split("/").filter(Boolean).length;

  if (keyword === "propertyNames") return `${params.propertyName} is not a token name`;

  if (keyword === "required")
    return params.missingProperty === "values"
      ? `${name} has no values`
      : `${name} declares no ${params.missingProperty}`;

  if (keyword === "additionalProperties")
    return depth === 1
      ? `${name} has an unknown field ${params.additionalProperty}`
      : `${name} declares an unknown mode ${params.additionalProperty}`;

  if (keyword === "pattern") return `${name} ${mode} is neither a hex nor a token reference: ${data}`;

  if (keyword === "type") {
    if (depth === 0) return "the document is not a map of tokens";
    if (depth === 1) return `${name} is not a map`;
    if (depth === 2) return `${name} values is not a map`;

    return `${name} ${mode} is not a string`;
  }

  return `${instancePath || "the document"} ${message}`;
}

/** Every way the document fails the schema, or an empty list. */
export function validateDocument(document: unknown) {
  if (validate(document)) return [];

  return (validate.errors ?? [])
    // propertyNames reports the bad name twice: once as the inner pattern it
    // failed, once as the name itself. The second one is the readable half.
    .filter((error) => !(error.keyword === "pattern" && error.instancePath === ""))
    .map(describe);
}
