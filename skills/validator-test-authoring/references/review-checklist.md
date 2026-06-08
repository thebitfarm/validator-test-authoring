# Validator Suite Review Checklist

Run through this list before returning a suite to the user.

## Structural
- [ ] Top-level keys present: `displayName`, `variableData`, `connectorConfigs`, `tests`.
- [ ] `tests` is a GUID-keyed object (not an array). Same for `actions`.
- [ ] Every test has `type` of `test` or `groupHeader`.
- [ ] No executable actions live inside a `groupHeader`.
- [ ] Each action has `category` ∈ {`PRETEST`, `TEST`, `POSTTEST`}.

## Connector & Action Integrity
- [ ] `connectorConfigs` includes a populated `GenericActions` connector in every suite.
- [ ] Every action's `connectorInstanceId` exists in `connectorConfigs`.
- [ ] Every `actionMethod` exists in `assets/source-files/Validator_Schema.json` under the matching connector class.
- [ ] All action fields map to widgets defined in the schema (no invented fields).
- [ ] Action descriptions are human-meaningful (they appear in the result log).
- [ ] Generic utility methods (`runTemplate`, `runCleanup`, `setVariables`, `calculateVariable`, `echo`, etc.) are wired to the `GenericActions` connector `connectorInstanceId`.

## Variables
- [ ] `variableNames`, each `variableValues` row, and `variableGroups` lengths agree.
- [ ] Every `${...}` token resolves to a `variableNames` entry or a variable produced by an earlier action.
- [ ] No hardcoded environment-specific values that should be variables.

## Assertions
- [ ] Eventual-consistency asserts include `assertRetryCount` and `assertRetryInterval`.
- [ ] `compOper` and `compMode` match the data type (use `dn` for DNs, `regex` for patterns, `numeric` for counts).
- [ ] Existence checks precede value checks where ordering matters.

## Rerunnability & Cleanup
- [ ] Each test has a deterministic identity strategy (variable-driven names, suffixes).
- [ ] POSTTEST teardown removes anything created in PRETEST/TEST.
- [ ] Reusable setup/cleanup is factored into `templateTest: true` tests and invoked via `runTemplate`.
- [ ] `runCleanup` is used where the test defines per-test cleanup steps.

## Security
- [ ] No cleartext credentials in the suite — use variables or encrypted values (`b64~...`).
- [ ] WS Listener basic-auth headers, if used, are fed from variables.

## Style
- [ ] `displayName` values read like sentences ("Assert Object Exists in AD").
- [ ] Comments via `comment` action where complex logic needs explaining.
- [ ] `wait` actions are absent or clearly justified.
