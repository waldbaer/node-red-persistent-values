# value-configuration Specification

## Purpose

Defines the `persistent values config` node: the central, editable declaration of every
persistent value of a Node-RED installation, including its identity, datatype, default
value, context scope and context storage.

## Requirements

### Requirement: Configuration node holds a named list of persistent values

A `persistent values config` node SHALL carry a `name` and a `values` array. Each entry of
`values` SHALL consist of `id`, `name`, `datatype`, `default`, `description`, `scope` and
`storage`. The configuration name is part of the context key of every value it declares
(see `context-access`), so renaming a configuration orphans already-persisted data.

#### Scenario: Configuration is loaded with its values
- **WHEN** a flow containing a `persistent values config` node is deployed
- **THEN** the runtime node exposes `name` and `values` exactly as configured

#### Scenario: Configuration name is required
- **WHEN** the editor validates a configuration whose `name` is empty
- **THEN** the configuration is marked invalid and cannot be deployed

### Requirement: Supported datatypes

Every configured value SHALL declare exactly one of the datatypes `bool`, `num`, `str` or
`json`. The datatype is the contract checked on every read and write of that value. The
default datatype for a newly added value is `bool`.

#### Scenario: A new value entry defaults to boolean
- **WHEN** the user adds a new value row in the configuration editor
- **THEN** the datatype is preselected as `bool` and the default value as `false`

#### Scenario: JSON default is stored as text
- **WHEN** a value is configured with datatype `json`
- **THEN** its `default` is persisted as a JSON string in the flow and parsed at runtime

### Requirement: Default value is normalized to the configured datatype

The editor SHALL store the default value in the JavaScript type matching the configured
datatype: a `num` default is converted with `Number()`, a `bool` default is converted by
comparing against the string `'true'`. `str` and `json` defaults are stored as text.

#### Scenario: Numeric default is stored as a number
- **WHEN** the user enters `23` as default of a `num` value and saves the configuration
- **THEN** the flow holds `default: 23` as a number, not as the string `"23"`

#### Scenario: Boolean default is stored as a boolean
- **WHEN** the user selects `true` as default of a `bool` value and saves the configuration
- **THEN** the flow holds `default: true` as a boolean

### Requirement: Context scope selection

Every configured value SHALL declare the context scope `global`, `flow` or `node`. A value
without a configured scope defaults to `global`.

#### Scenario: Scope defaults to global
- **WHEN** a value entry is added without an explicit scope
- **THEN** the editor preselects `global`

### Requirement: Context storage selection

Every configured value SHALL declare a context storage. The selectable storages are the
literal `default` plus every store configured in `RED.settings.context.stores`. A value
referencing a storage that is not available in the current Node-RED installation SHALL be
reset to `default` when the configuration is opened, and SHALL fail editor validation.

#### Scenario: Unavailable storage falls back to default in the editor
- **WHEN** a configuration referencing storage `file` is opened in an installation where no
  `file` store is configured
- **THEN** the storage field of that value shows `default`

#### Scenario: Unavailable storage fails validation
- **WHEN** the editor validates a value whose `storage` is not among the available storages
- **THEN** validation fails and an error naming the storage is logged

### Requirement: Value names are unique within a configuration

The editor SHALL reject a configuration in which a value name is empty or used more than
once, because the value name is part of the context key and of the deprecated name-based
value reference.

#### Scenario: Empty value name rejected
- **WHEN** a value entry has an empty or whitespace-only name
- **THEN** validation fails with an error stating that the name must not be empty

#### Scenario: Duplicate value name rejected
- **WHEN** two value entries of the same configuration share a name
- **THEN** validation fails with an error naming the duplicate and its number of occurrences

### Requirement: Default value must parse as the configured datatype

The editor SHALL reject a configuration in which a default value cannot be interpreted as
its configured datatype.

#### Scenario: Malformed JSON default rejected
- **WHEN** a value of datatype `json` has a default that is not valid JSON
- **THEN** validation fails and an error naming the value and the datatype is logged

### Requirement: Each value carries a stable UUID identity

Every value entry SHALL be identified by a UUID that is generated once, when the entry is
created, and never changes afterwards. The UUID is obtained from the backend endpoint
`GET /persistentvalues/config/generate_uuid` (see `editor-backend-api`). The UUID decouples
the reference held by a value node from the value name, so renaming a value does not break
the nodes referencing it.

#### Scenario: New value entry receives a UUID
- **WHEN** the user adds a value row that has no `id` yet
- **THEN** the editor requests a UUID from the backend and stores it in the entry's hidden id field

#### Scenario: Existing UUID is preserved
- **WHEN** a configuration with existing value entries is opened and saved again
- **THEN** every entry keeps the `id` it already had

### Requirement: Generated configuration name for new configurations

When a configuration node is opened without a name, the editor SHALL propose
`Persistent Values Config <N>`, where `<N>` is the number of configurations currently known
to the backend.

#### Scenario: Second configuration gets a generated name
- **WHEN** a new configuration node is opened while one configuration already exists
- **THEN** the name field is prefilled with `Persistent Values Config 1`
