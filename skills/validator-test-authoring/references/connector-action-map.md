# Connector / Action Map

Authoritative source: [Validator_Schema.json](../assets/source-files/Validator_Schema.json). Search by the JSON key (e.g. `"assertAttributesValues"`) to see widget contracts.

## Connector Classes (`connectorClassName`)

| Class | Purpose |
|---|---|
| `GenericActions` | Variable, date, parsing, control-flow utilities (no remote system). |
| `EDirConnector` | NetIQ eDirectory CRUD + assertions over LDAP. |
| `ADConnector` | Active Directory CRUD + assertions. |
| `LDAPConnector` | Generic LDAP CRUD + assertions. |
| `HTTPConnector` | REST/SOAP calls with assertions and capture into variables. |
| `JDBCConnector` | Generic JDBC query + row/result assertions. |
| `MSSQLConnector` | MS SQL Server flavor of JDBC. |
| `PostgreSQLConnector` | PostgreSQL flavor of JDBC. |
| `RemoteConnector` | SSH command execution + output assertions. |
| `SMTPConnector` | Local SMTP receiver + email assertions. |
| `TextFileConnector` | File existence/content assertions. |
| `UserAppConnector` | NetIQ UserApp role/resource/workflow assertions. |
| `WSListenerConnector` | Local web-service listener for capturing/validating downstream POST/PUT payloads. |
| `ExecuteConnector` | Local process execution + output assertions. |

## Generic Utility Actions (most-used)

- Variables: `setVariables`, `calculateVariable`, `calculateDate`, `generateRandomString`, `base64Encode`, `base64Decode`.
- Parsing: `getJsonValue`, `getXPathValue`.
- Assertions: `assertVariables`, `assertJson`, `assertDates`.
- Flow: `echo`, `comment`, `wait`, `pause`, `manualTest`, `runTemplate`, `runCleanup`.

## Directory Actions (eDir / AD / LDAP — same patterns, per-class fields)

- Mutation: `createObject`, `addAttributesValues`, plus modify/remove variants per class.
- Capture: `getLdapAttributes`.
- Assert: `assertObjectExists`, `assertAttributeExists`, `assertAttributesValues`, `assertLdapFilter`, `assertPasswordEquals`, `assertUserLoginValid`. (eDir adds `assertAssoc/Ent/Path Attribute`.)

## HTTP Actions

- `assertGetResults`, `assertPostResults` (also covers PUT/DELETE).
- `getGetResultsIntoVar` to capture response into a variable.
- Supports `headerData`, `formData`, `data` (payload), `httpResponseCode`, `compOper`/`compMode`, `assertRetry*`.

## SQL Actions (JDBC / MSSQL / PostgreSQL)

- `assertResultExists`, `assertRowCount`, plus `assertUserLoginValid` where applicable.

## Remote / Execute / TextFile

- Remote: `executeCommand`, `assertCommandResults`.
- Execute: `assertExecuteResults` and related local-process variants.
- TextFile: `assertFileExists`, `assertFileContains`.

## SMTP

- Lifecycle: `startServer`, `stopServer`.
- Assertion: `assertEmail` (with retry; can mark received or delete).

## WS Listener

- Lifecycle: `startListener`, `stopListener`.
- Configuration: `postConfiguration` (per-endpoint headers, basic auth, response payloads/codes).
- Validation pattern: external system POSTs to the listener; an `HTTPConnector` `assertGetResults` against the same URL validates the captured payload.
- Static endpoints from [wslistener-app.js](../assets/source-files/wslistener-app.js): `/wsconntest`, `/wslist`, `/shutdown`.

## UserApp

- Identity & access: `assertUserHasRole`, `assertUserHasResourceAssigned`, `assertActivityComments`, plus role/resource/workflow lifecycle actions in the schema.

## Common Comparison Fields

- `compOper`: contains, equals, starts with, ends with, valued, greater than, less than, `in subtree`, plus `not ...` variants.
- `compMode`: `case ignore`, `case sensitive`, `regex`, `dn`, `numeric`.
- Retry: `assertRetryCount`, `assertRetryInterval` (ms).
