---
name: validator-test-authoring
description: 'Create, review, or refactor NetIQ IDM Validator 2.0.1 JSON test suites and templates. Use when the user asks to generate Validator tests, add PRETEST/TEST/POSTTEST actions, validate connector/action JSON against Validator_Schema.json, build templateTests for setup/cleanup, add retry-aware assertions, model variableGroups/variableValues, or work with eDir/AD/LDAP/HTTP/JDBC/UserApp/SMTP/WSListener connectors. Triggers: "validator suite", "validator test", "testsuites/*.json", "actionMethod", "connectorInstanceId", "assertRetry", "runTemplate", "runCleanup", "WSListener", "IDM validator".'
---

# Validator Test Authoring

Operationalizes the discovery in [NetIQ IDM Validator Discovery](./references/netiq-idm-validator-discovery.md) for repeatable Validator suite generation and review.

## When to Use
- Generating a new test suite under `testsuites/` from a described scenario.
- Adding/editing tests, templateTests, or actions inside an existing suite JSON.
- Reviewing a suite for connector/action correctness, variable hygiene, retry usage, and rerunnability.
- Producing cleanup/setup `templateTest` blocks and wiring them via `runTemplate` / `runCleanup`.

## Inputs to Collect (ask only if missing)
- Scenario being tested (system under test, expected propagation/result).
- Target connectors (eDir, AD, LDAP, HTTP, JDBC, UserApp, SMTP, WSListener, Remote, Execute, TextFile).
- Variable environments needed (e.g. DEV/QA/PROD) and any unique-naming strategy.
- Eventual-consistency expectations (informs retry counts/intervals).

## Procedure
1. **Ground the request**
   - Read [NetIQ IDM Validator Discovery](./references/netiq-idm-validator-discovery.md) for runtime + semantics.
   - For any unfamiliar action, look up its widget contract in [Validator_Schema.json](./assets/source-files/Validator_Schema.json) (search by `actionMethod` key). Treat the schema as authoritative for field names.
   - Skim a comparable example in the bundled template samples before writing (see optional links below).

2. **Plan the suite structure**
   - Pick canonical phases per test:
     - PRETEST: `setVariables`, `calculateVariable`, `runCleanup`, `runTemplate` (setup).
     - TEST: action under test + retry-aware asserts + value capture (`getLdapAttributes`, `getJsonValue`, `getXPathValue`).
     - POSTTEST: cleanup `runTemplate` and final asserts.
   - Decide which reusable steps belong in `templateTest: true` tests.

3. **Author the JSON**
   - Start from [assets/suite-skeleton.json](./assets/suite-skeleton.json).
   - Use GUID-keyed objects for `tests` and `actions` (generate v4 GUIDs).
   - Set `category` to `PRETEST` | `TEST` | `POSTTEST` on every action.
   - Reference connectors by `connectorInstanceId` keys defined in `connectorConfigs`.
   - Apply guidance in [references/authoring-guide.md](./references/authoring-guide.md) for variables, assertions, and naming.

4. **Validate before returning**
   - Run the checklist in [references/review-checklist.md](./references/review-checklist.md).
   - Confirm every `${...}` token has a source (variableData row or prior action).
   - Confirm every `connectorInstanceId` exists in `connectorConfigs`.
   - Confirm assertions against eventual-consistency systems use `assertRetryCount` + `assertRetryInterval` rather than `wait`.

5. **Place outputs correctly**
   - New full suites go under `testsuites/`.
   - Reusable cleanup/setup go inside the suite as `templateTest: true` tests, invoked via `runTemplate`.

## Connector / Action Reference
See [references/connector-action-map.md](./references/connector-action-map.md) for the supported connector classes and the high-frequency `actionMethod` values, with pointers into `Validator_Schema.json`.

## Optional Local Sample Templates
- [SampleADTemplate.json](./assets/samples/templates/SampleADTemplate.json)
- [SampleExecuteConnectorTemplate.json](./assets/samples/templates/SampleExecuteConnectorTemplate.json)
- [SampleGenericConnectorTemplate.json](./assets/samples/templates/SampleGenericConnectorTemplate.json)
- [SampleHTTPTemplate.json](./assets/samples/templates/SampleHTTPTemplate.json)
- [SampleMSSQLTemplate.json](./assets/samples/templates/SampleMSSQLTemplate.json)
- [SampleRemoteConnectorTemplate.json](./assets/samples/templates/SampleRemoteConnectorTemplate.json)
- [SampleTextFileConnectorTemplate.json](./assets/samples/templates/SampleTextFileConnectorTemplate.json)
- [SampleUserAppTemplate.json](./assets/samples/templates/SampleUserAppTemplate.json)

## Anti-patterns to Avoid
- Static `wait` instead of `assertRetryCount` for propagation checks.
- Hardcoded DNs/IDs that prevent rerun — drive them from `variableData`.
- Mixing test logic into a `groupHeader` (those are organizational, not executable).
- Inventing action fields — always map to `Validator_Schema.json`.
- Committing cleartext credentials; prefer variable substitution.
