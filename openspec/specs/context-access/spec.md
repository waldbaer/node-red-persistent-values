# context-access Specification

## Purpose

Defines how a configured persistent value is mapped onto the underlying Node-RED context:
which context object is addressed, under which key, and in which context store.

## Requirements

### Requirement: Context key derivation

The context key of a persistent value SHALL be the configuration name and the value name
joined by an underscore, with every space replaced by an underscore:
`<config name>_<value name>`, spaces → `_`. This derivation is part of the persisted data
contract — changing it orphans every value already stored in user installations.

#### Scenario: Key built from configuration and value name
- **WHEN** the configuration `TestConfig` declares the value `boolean`
- **THEN** the context key is `TestConfig_boolean`

#### Scenario: Spaces replaced by underscores
- **WHEN** the configuration `test/ Configuration` declares the value `Persisted~Value`
- **THEN** the context key is `test/_Configuration_Persisted~Value`

### Requirement: Scope resolution

The configured scope SHALL select the context object: `node` uses the node context, `flow`
the flow context and `global` the global context.

#### Scenario: Flow scope reads the flow context
- **WHEN** a value configured with scope `flow` is read
- **THEN** the value is taken from the flow context under the derived context key

#### Scenario: Node scope reads the node context
- **WHEN** a value configured with scope `node` is read
- **THEN** the value is taken from the node context under the derived context key

### Requirement: Unsupported scope aborts message processing

If the resolved scope is none of `node`, `flow` or `global`, the node SHALL log an error
naming the scope, the configuration and the value, and SHALL abort processing of the
message without producing any output.

#### Scenario: Invalid scope produces an error and no output
- **WHEN** a message reaches a value node whose configured scope is not supported
- **THEN** an error naming the failing scope is logged
- **THEN** neither output emits a message

### Requirement: Storage resolution

The configured storage SHALL select the context store. The literal storage `default` SHALL
address the context without naming a store, so Node-RED applies its configured default
store. Any other storage SHALL be passed to the context as the explicit store name, for
both reads and writes.

#### Scenario: Default storage uses the Node-RED default store
- **WHEN** a value configured with storage `default` is written
- **THEN** the value is stored in the context store configured as `contextStorage.default`

#### Scenario: Named storage is addressed explicitly
- **WHEN** a value configured with storage `file` is written
- **THEN** the value is readable from the `file` store under the derived context key
- **THEN** it is not readable from the `memory` store

### Requirement: Absent context entry yields the configured default

When the context holds no entry for the derived key, the node SHALL use the configured
default value as the current value and SHALL remember that the current value is a default.
For datatype `json`, the configured default SHALL be parsed from its stored JSON text.

#### Scenario: Empty context reads the configured default
- **WHEN** a value is read and its context entry does not exist
- **THEN** the configured default value is used as the current value

#### Scenario: JSON default is parsed
- **WHEN** a `json` value with default `{"boolean":false,"number":0,"string":"empty"}` is read from an empty context
- **THEN** the output carries the parsed object, not the JSON string
