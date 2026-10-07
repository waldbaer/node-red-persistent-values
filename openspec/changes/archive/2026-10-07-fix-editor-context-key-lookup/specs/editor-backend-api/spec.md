# Spec Delta

## ADDED Requirements

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
