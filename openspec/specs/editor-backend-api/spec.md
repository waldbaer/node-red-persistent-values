# editor-backend-api Specification

## Purpose

Defines the `RED.httpAdmin` endpoints the Node-RED editor uses to populate and maintain the
persistent value configuration, which is needed because configuration node data is not
otherwise available to other nodes' edit dialogs while editing.

## Requirements

### Requirement: Configurations are mirrored in the backend

The configuration node SHALL keep a process-global registry of deployed configurations,
keyed by node id and holding `name` and `values`. The registry SHALL be updated when a
configuration node is instantiated and through the save and delete endpoints, so that the
value node's edit dialog can offer the values of a configuration that has not been deployed
yet.

#### Scenario: Deployed configuration is registered
- **WHEN** a `persistent values config` node is deployed
- **THEN** it is retrievable through the get endpoint under its node id

### Requirement: Get configurations

`GET /persistentvalues/config/get` SHALL return all known configurations as an object keyed
by node id when called without query parameters, and the single configuration when called
with an `id` query parameter. An unknown `id` SHALL be answered with HTTP 404.

#### Scenario: All configurations returned
- **WHEN** the endpoint is called without an id and two configurations are deployed
- **THEN** the response carries both, keyed by node id

#### Scenario: Single configuration returned
- **WHEN** the endpoint is called with the id of a deployed configuration
- **THEN** the response carries that configuration's name and values

#### Scenario: Unknown configuration
- **WHEN** the endpoint is called with an id that is not registered
- **THEN** the response status is 404

### Requirement: Save configuration

`POST /persistentvalues/config/save` SHALL store the posted `name` and `values` under the
posted `id`, creating the entry if it does not exist and replacing it otherwise, and SHALL
answer with HTTP 200. A request without `values` SHALL be stored with an empty value list.

#### Scenario: New configuration saved
- **WHEN** a configuration is posted under an id that is not yet registered
- **THEN** the response status is 200 and the configuration is retrievable through the get endpoint

#### Scenario: Existing configuration replaced
- **WHEN** a configuration is posted under an already registered id
- **THEN** the stored entry is replaced by the posted one

#### Scenario: Configuration without values
- **WHEN** a configuration is posted without a `values` member
- **THEN** it is stored with an empty `values` array

### Requirement: Delete configuration

`POST /persistentvalues/config/delete` SHALL remove the configuration with the posted `id`
and answer with HTTP 200, or answer with HTTP 404 if no such configuration is registered.

#### Scenario: Registered configuration deleted
- **WHEN** a registered id is posted
- **THEN** the response status is 200 and the configuration is no longer retrievable

#### Scenario: Unknown configuration deleted
- **WHEN** an unregistered id is posted
- **THEN** the response status is 404

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
