# editor-backend-api Specification

## Purpose

Defines the `RED.httpAdmin` endpoints the Node-RED editor uses for what only the runtime can
provide: generating the UUID of a new value and deriving the context key of a value.

## Requirements

### Requirement: Generate value identity

`GET /persistentvalues/config/generate_uuid` SHALL return a newly generated UUID, used by
the configuration editor as the stable identity of a new value entry.

#### Scenario: UUID generated
- **WHEN** the endpoint is called
- **THEN** the response carries a valid UUID

### Requirement: Resolve context key

`GET /persistentvalues/util/getcontextkey` SHALL return the context key derived from the
`configName` and `valueName` query parameters, so that the value node's edit dialog can show
the user which context variable a value maps to. The derivation is the one defined in
`context-access`.

#### Scenario: Context key resolved
- **WHEN** the endpoint is called with `configName=test/ Configuration` and `valueName=Persisted~Value`
- **THEN** the response carries `test/_Configuration_Persisted~Value`

### Requirement: Failed context key lookup in the edit dialog

When the value node's edit dialog cannot obtain the context key of the selected value from
`GET /persistentvalues/util/getcontextkey`, it SHALL log a warning without a node, naming
the configuration, the value and the request's HTTP status, or that no response arrived, and
SHALL hide the value tip instead of showing the tip of a previously selected value.

#### Scenario: Context key endpoint fails
- **WHEN** a value is selected in the value node's edit dialog and the context key request fails
- **THEN** a warning prefixed with `[Persistent Values] ` that names the configuration, the value and the request's HTTP status, or `no response` when none arrived, is written to the browser console
- **AND** the value tip is hidden

#### Scenario: Context key endpoint answers
- **WHEN** a value is selected in the value node's edit dialog and the context key request succeeds
- **THEN** the value tip shows the returned context key together with the value's datatype, default, scope, storage and description
