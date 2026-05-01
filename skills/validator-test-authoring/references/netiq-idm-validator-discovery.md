# NetIQ IDM Validator 2.0.1 - Discovery Notes

This document captures practical context for creating and reviewing Validator test suites.

Provenance: Adapted from source repository discovery notes and packaged with this skill for portable distribution.

## 1) What this product is

NetIQ IDM Validator is a Java-based test runner and web UI for integration testing.
It executes JSON test suites that orchestrate actions across connectors (eDirectory/LDAP, AD, HTTP, JDBC, UserApp, etc.), plus utility actions for variables, parsing, waits, and templates.

Primary evidence:
- Runtime/service config: `validator.yml`
- Action/connector schema: `config/Validator_Schema.json`
- Example suite style: `testsuites/IDV-Ghost-And-OpCoTransfer.json`
- Sample templates: `templates/*.json`
- WS listener implementation: `nodeapps/wslistener/app.js`

## 2) Runtime and service model

- Main app starts from `start-validator_win.bat`.
  - Java main class: `com.microfocus.validator.ValidatorApplication`
  - Mode: `server`
  - Config file: `validator.yml`
- API/UI service endpoint from `validator.yml`:
  - HTTPS app connector on port `8380`
  - HTTPS admin connector on port `8381`
  - Swagger prefix: `/api/validator/v1`
- DB is H2 (`jdbc:h2:./validator;DATABASE_TO_UPPER=false;NON_KEYWORDS=USER`).
- Scheduler config is in `scheduler/scheduler.json`.
- Separate node-based WS listener helper is under `nodeapps/wslistener/` and can be started by connector actions.

Instance-specific credentials provided by user for this environment:
- Username: `admin`
- Password: `!4ud4city`

## 3) JSON test suite semantic model

A suite JSON generally contains:

```json
{
  "displayName": "...",
  "description": "...",
  "variableData": {
    "variableGroupActive": "DEV",
    "variableGroups": ["DEV", "PROD", "QA"],
    "variableNames": ["VarA", "VarB"],
    "variableValues": [
      ["DEV value A", "DEV value B"],
      ["PROD value A", "PROD value B"],
      ["QA value A", "QA value B"]
    ]
  },
  "connectorConfigs": {
    "<connector-guid>": {
      "displayName": "IDV",
      "connectorClassName": "EDirConnector",
      "connectorClass": "EDirConnector",
      "... connector properties ...": "..."
    }
  },
  "tests": {
    "<test-guid>": {
      "displayName": "Test Name",
      "type": "test",
      "enabled": true,
      "templateTest": false,
      "actions": {
        "<action-guid>": {
          "category": "PRETEST|TEST|POSTTEST",
          "connectorInstanceId": "<connector-guid>",
          "actionMethod": "setVariables",
          "enabled": true,
          "... action fields ...": "..."
        }
      }
    }
  }
}
```

### Key semantics

- `connectorConfigs` keys are instance IDs used by actions via `connectorInstanceId`.
- `tests` is a GUID-keyed object, not an array.
- `actions` is also GUID-keyed object, not an array.
- `category` controls phase order: `PRETEST`, `TEST`, `POSTTEST`.
- `type` at test level commonly:
  - `test` for executable tests
  - `groupHeader` for grouping/visual organization
- `templateTest: true` marks reusable template-style tests callable via `runTemplate`.
- Variable tokens use `${VarName}` expansion.
- JS expression embedding is supported in values (examples show `js:{...}`).

## 4) Assertion and comparison semantics

Many assert actions share comparison fields:
- `compOper`: contains/equals/starts with/ends with/valued plus negative and numeric variants.
- `compMode`: `case ignore`, `case sensitive`, `regex`, `dn`, `numeric`.

Retry-capable assert actions usually include:
- `assertRetryCount`
- `assertRetryInterval` (ms)

Guidance:
- Prefer assert retries over static waits.
- Use `regex` mode for pattern assertions.
- Use `dn` mode when comparing LDAP DNs.

## 5) Connector/action capability map (high value)

From `config/Validator_Schema.json`, connectors include:
- `GenericActions`
- `ADConnector`
- `EDirConnector`
- `ExecuteConnector`
- `HTTPConnector`
- `JDBCConnector`
- `LDAPConnector`
- `MSSQLConnector`
- `PostgreSQLConnector`
- `RemoteConnector`
- `SMTPConnector`
- `TextFileConnector`
- `UserAppConnector`
- `WSListenerConnector`

High-frequency action patterns:
- Generic utilities:
  - `setVariables`, `calculateVariable`, `calculateDate`, `echo`, `wait`, `runTemplate`, `runCleanup`
  - parsing/assert helpers: `getJsonValue`, `getXPathValue`, `assertVariables`, `assertJson`, `assertDates`
- Directory-centric (AD/eDir/LDAP variants):
  - object CRUD and attribute mutation
  - assertions: object exists, attributes exist/values, LDAP filter, password/login checks
- HTTP connector:
  - `assertGetResults`, `assertPostResults` style validation with headers/form/payload and response code checks
- SQL connectors:
  - query execution with row/result assertions
- Remote connector:
  - remote command execution and output assertions
- SMTP connector:
  - start/stop local SMTP receiver and assert received email content
- WS listener connector:
  - starts a local listener used as an assertion target for downstream POST/PUT payload validation

## 6) WS Listener behavior (important for integration tests)

`nodeapps/wslistener/app.js` behavior summary:
- POST/PUT to any endpoint creates/updates corresponding GET endpoint data.
- GET on that endpoint returns captured payload.
- Optional per-endpoint config (`wsListenerConfig`) can set:
  - response payloads/codes
  - required basic auth header
  - content type
  - specific post/delete response codes
- Static endpoints:
  - `/wsconntest` connection test
  - `/wslist` current endpoint map
  - `/shutdown` terminate listener

This allows black-box validation that another system emitted expected payloads.

## 7) Practical test-authoring pattern

When generating new tests, prefer this flow:
1. PRETEST:
   - `setVariables` for data and unique suffixes.
   - optional `runCleanup` and setup template(s).
2. TEST:
   - execute action(s) under test (create/modify/call).
   - use assert actions with retries to verify propagation/state.
   - capture values into variables (`getLdapAttributes`, HTTP into variable, JSON parse, etc.).
3. POSTTEST:
   - teardown via template cleanup and final checks.

## 8) What to look for when reviewing or generating suites

- Connector/action consistency:
  - every action's `connectorInstanceId` exists in `connectorConfigs`.
  - action fields match the `actionMethod` schema.
- Variable hygiene:
  - all `${...}` tokens have sources (variableData or prior actions).
  - environment rows in `variableValues` align with `variableGroups` and `variableNames` indexes.
- Assertion quality:
  - use retries where eventual consistency is expected.
  - comparison operator/mode fit the data type.
- Isolation/cleanup:
  - each test should be rerunnable (cleanup/setup templates, deterministic naming).
- Security:
  - avoid cleartext credentials in committed suites where possible.

## 9) Suggested prompts for future agent usage

Use prompts like:
- "Create a Validator test suite that creates an eDir user and asserts attribute propagation to AD with retry-aware assertions."
- "Generate a templateTest for cleanup of objects created by these tests."
- "Add POSTTEST teardown and convert static waits to assert retries."
- "Validate this suite JSON against connector action semantics from Validator_Schema.json and list mismatches."

## 10) Source files to trust first

- `config/Validator_Schema.json` (authoritative connector/action fields and semantics)
- `testsuites/*.json` (real-world patterns in this environment)
- `templates/*.json` (reusable, starter patterns)
- `validator.yml` (ports, HTTPS, API prefix, DB)
- `nodeapps/wslistener/app.js` (listener runtime semantics)
- `scheduler/scheduler.json` (scheduled execution/mail summary behavior)
