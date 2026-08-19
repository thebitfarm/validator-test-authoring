# Validator Suite Authoring Guide

Detail backing the SKILL.md procedure. Use alongside `assets/source-files/Validator_Schema.json`.

## Suite Top-Level Shape

```json
{
  "displayName": "<Suite Name>",
  "description": "<Purpose>",
  "variableData": {
    "variableGroupActive": "DEV",
    "variableGroups": ["DEV", "QA", "PROD"],
    "variableNames": ["VarA", "VarB", "VarC"],
    "variableValues": [
      ["DEV-A", "DEV-B", "DEV-C"],
      ["QA-A",  "QA-B", "QA-C"],
      ["PROD-A","PROD-B", "PROD-C"]
    ]
  },
  "connectorConfigs": { "<guid>": { "...": "..." } },
  "tests": { "<guid>": { "...": "..." } }
}
```

Rules:
- `variableValues` rows align by index with `variableGroups`.
- Each row's columns align by index with `variableNames`.
- All three arrays must stay in lock-step length-wise.
- Every suite must include a populated `GenericActions` connector entry in `connectorConfigs`.
- Generic utility actions must use the `GenericActions` connector `connectorInstanceId` (for example `runTemplate`, `runCleanup`, `setVariables`, `calculateVariable`, `echo`; and `comment` when a `connectorInstanceId` field is used).

## Test Object

```json
"<test-guid>": {
  "displayName": "Create User and Verify in AD",
  "description": "",
  "type": "test",                // or "groupHeader"
  "enabled": true,
  "templateTest": false,         // true => callable via runTemplate
  "actions": { "<action-guid>": { "..." : "..." } }
}
```

Rules:
- `type: "groupHeader"` is presentational only — do not put executable logic there.
- `templateTest: true` tests must be invoked from a real test via `runTemplate` referencing the template's `testId` (the test-guid).

## Action Object

Required-ish fields on every action:
- `category`: `PRETEST` | `TEST` | `POSTTEST`
- `connectorInstanceId`: must exist in `connectorConfigs`
- `actionMethod`: must match a key in `Validator_Schema.json` for that connector
- `enabled` and `exec`: both must be present and must mirror each other. Use `true`/`true` when the action should run in Validator test execution, and `false`/`false` when the action should be skipped. Do not generate mixed states such as `"enabled": true` with `"exec": false`.
- `description`: short human label

The remaining fields are dictated by the action's `widgets` block in `Validator_Schema.json`. Do not invent fields.

## Variables
- When generating variables for use in the top-level `variableData`, always generate 3 groups of "DEV", "QA", and "PROD". Make the "DEV" group the active group.
- Reference variables anywhere as `${VarName}`.
- Set new variables with `setVariables` (HashMap of `name -> [values]`).
- Compute uniqueness with `calculateVariable` (e.g., increment a numeric suffix) or JS embedding (`"js:{ ... }"`).
- Capture remote/system state into variables with:
  - eDir/AD/LDAP: `getLdapAttributes`
  - HTTP: `getGetResultsIntoVar`
  - JSON parsing: `getJsonValue`
  - XML parsing: `getXPathValue`

## HTTP URL Encoding

Any value interpolated into an `HTTPConnector` URL suffix or path segment must be properly percent-encoded (URI encoded) before use.

- Spaces become `%20` (or `+` only in query strings — prefer `%20` for consistency).
- Characters with special URL meaning (`#`, `&`, `=`, `?`, `+`, `/`, `%`) must be encoded when they appear as data, not as URL structure.
- Non-ASCII characters must be UTF-8 percent-encoded.

Encoding strategies:
- Pre-encode a variable value using a `setVariables` action with `js:{ encodeURIComponent("${MyVar}") }` and use the encoded variable in the URL field.
- Use the built-in `base64Encode` action for payloads that need base64, but note this is **not** the same as URI encoding — apply `encodeURIComponent` for URL paths/query strings.
- When the URL suffix is static and known to be safe (alphanumeric + `-` + `_` + `.`), no encoding is needed.

Example — safe encoding via JS:
```json
{
  "actionMethod": "setVariables",
  "connectorInstanceId": "<generic-guid>",
  "attributesValues": {
    "EncodedSuffix": ["js:{ encodeURIComponent(\"${RawSuffix}\") }"]
  }
}
```
Then reference `${EncodedSuffix}` in the HTTP action's URL field.

## Assertions

Common comparison fields:
- `compOper`: contains | equals | starts with | ends with | valued | greater than | less than | (and `not ...` variants)
- `compMode`: case ignore | case sensitive | regex | dn | numeric

For systems with eventual consistency (eDir->AD propagation, HTTP-driven workflows, SMTP delivery, WS listener arrivals) ALWAYS prefer:
```json
"assertRetryCount": "10",
"assertRetryInterval": "2000"
```
over a static `wait` action.

Typical assertions:
- Existence: `assertObjectExists`, `assertAttributesExist`, `assertResultExists`, `assertFileExists`, `assertEmail`.
- Values: `assertAttributesValues`, `assertVariables`, `assertJson`, `assertGetResults`, `assertPostResults`, `assertCommandResults`, `assertRowCount`.
- Identity: `assertUserLoginValid`, `assertPasswordEquals`, `assertUserHasRole`, `assertUserHasResourceAssigned`.
- Dates: `assertDates` for relative/absolute date comparisons.

## Templates and Cleanup

- Define reusable steps as `templateTest: true` tests in the same suite.
- Call them with the `runTemplate` action and `testId` = template test's GUID.
- For per-test cleanup defined in the test's POSTTEST section, use `runCleanup` to execute its cleanup actions.
- Goal: every test must be rerunnable without manual intervention.

## Naming Conventions

- Use deterministic, variable-driven object names (e.g. `cn=${IDV-Aff-CN},ou=affiliations,o=data`).
- Suffix unique IDs with `${seq}` or a generated random string from `generateRandomString`.
- Keep `displayName` action-oriented ("Assert AD initials = fl") so result logs are readable.
