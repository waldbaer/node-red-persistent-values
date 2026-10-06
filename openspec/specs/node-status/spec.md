# node-status Specification

## Purpose

Defines the status text shown under a `persistent value` node in the Node-RED editor, which
reports the value last handled together with the declaration it was handled under.

## Requirements

### Requirement: Status reports value and declaration

After every processed message the node SHALL set its status to
`<value> [<datatype>,<scope>,<storage>]`, where `<datatype>` is the JavaScript type name of
the configured datatype: `boolean`, `number`, `string` or `json`.

#### Scenario: Status of a boolean value
- **WHEN** a global, default-storage `bool` value holding `true` is handled
- **THEN** the status text is `true [boolean,global,default]`

### Requirement: JSON values are not rendered into the status

For a value of datatype `json` the status SHALL show the placeholder `{JSON}` instead of the
value itself.

#### Scenario: Status of a JSON value
- **WHEN** a `json` value is handled
- **THEN** the status text starts with `{JSON} [`

### Requirement: Dynamically addressed value is named in the status

If the handled value differs from the one configured on the node — that is, when a dynamic
value override took effect — the status SHALL name the handled value before the datatype.

#### Scenario: Status after a dynamic value override
- **WHEN** a node configured for `boolean` handles a message overriding the value to `number`
- **THEN** the status text names `number` as the first meta info

### Requirement: Default storage is annotated with the resolved store

When the addressed value uses the storage `default` and `contextStorage.default` in the
Node-RED settings names another store, as in `default: 'memory'`, the status SHALL append
that store name in parentheses.

#### Scenario: Resolved default store shown
- **WHEN** `contextStorage.default` is `memory` and a value with storage `default` is handled
- **THEN** the status text ends with `default (memory)]`

#### Scenario: No default store configured
- **WHEN** no `contextStorage.default` is configured
- **THEN** the status text ends with `default]`

### Requirement: Status colour reports the blocking state

The status SHALL use a green dot when the message passes and a red dot when the block-if
rule discarded it.

#### Scenario: Blocked message shows a red status
- **WHEN** a matching block-if rule discards the message
- **THEN** the status is set with fill `red`

#### Scenario: Passing message shows a green status
- **WHEN** the message is emitted
- **THEN** the status is set with fill `green`
