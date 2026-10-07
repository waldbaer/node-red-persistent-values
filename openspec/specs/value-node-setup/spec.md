# value-node-setup Specification

## Purpose

Defines how a `persistent value` node resolves its referenced configuration and value at
deploy time, and how it refuses to operate when that reference is incomplete or broken.

## Requirements

### Requirement: Value node interface

A `persistent value` node SHALL have exactly one input and two outputs. Output 1 ("current
value") carries the message after the command has been executed. Output 2 ("on change")
carries the same message only when the command actually modified the context store. A
matching block-if rule suppresses both outputs (see `block-flow`).

#### Scenario: Node registers with one input and two outputs
- **WHEN** the node type is registered in the editor
- **THEN** it declares `inputs: 1` and `outputs: 2` with the labels `current value` and `on change`

### Requirement: Referenced configuration must exist

A `persistent value` node SHALL resolve the configuration node referenced by
`valuesConfig`. If the reference cannot be resolved, the node SHALL log an error naming the
node and its ID, and SHALL NOT register an input handler, so that incoming messages are
never processed.

#### Scenario: Missing configuration reference aborts setup
- **WHEN** a value node is deployed with an empty `valuesConfig`
- **THEN** an error matching `Incorrect or inconsistent configuration` is logged
- **THEN** the node has no registered input callback

### Requirement: Value reference by UUID

A `persistent value` node SHALL reference the selected value by the UUID stored in
`valueId`. A `valueId` that is present but not a valid UUID SHALL abort setup the same way
as a missing configuration.

#### Scenario: Value resolved by UUID
- **WHEN** a value node is deployed with a `valueId` matching a configured value
- **THEN** the node operates on that value, regardless of the name stored in `value`

#### Scenario: Malformed UUID aborts setup
- **WHEN** a value node is deployed with `valueId` set to a string that is not a UUID
- **THEN** an error matching `Incorrect or inconsistent configuration` is logged
- **THEN** the node has no registered input callback

### Requirement: Deprecated value reference by name

For flows created with version 1.1.0 or earlier, a `persistent value` node without a
`valueId` SHALL resolve the selected value by the name stored in `value`. This fallback is
deprecated and kept for backward compatibility only.

#### Scenario: Value resolved by name when no UUID is stored
- **WHEN** a value node is deployed without `valueId` but with `value` naming a configured value
- **THEN** the node operates on that value

#### Scenario: Neither UUID nor name aborts setup
- **WHEN** a value node is deployed with neither `valueId` nor `value`
- **THEN** an error matching `Incorrect or inconsistent configuration` is logged
- **THEN** the node has no registered input callback

### Requirement: UUID reference wins over a stale name

When a value is resolved by UUID, the node SHALL adopt the value name from the resolved
configuration entry, so that a value renamed in the configuration is still addressed
correctly and reported under its current name.

#### Scenario: Renamed value keeps working
- **WHEN** a value node references a value by UUID and that value was renamed in the configuration
- **THEN** the node uses the new name for the context key and for its status text

### Requirement: Option defaults

Unset node options SHALL fall back to documented defaults: command `read`, input/output
property `payload`, deep clone disabled, dynamic control disabled, dynamic command property
`command`, dynamic value property `topic`, previous-value output disabled with property
`previous_value`, value collection disabled with property `values`, block-if disabled with
rule `eq`, metadata output disabled with property `meta`.

#### Scenario: Node without options behaves as a reader on msg.payload
- **WHEN** a value node is deployed with no command and no message property configured
- **THEN** it executes the `read` command and writes the current value to `msg.payload`

### Requirement: Value selection in the edit dialog

The value node's edit dialog SHALL change the node only when it is closed with Done. While
the dialog is open, the value list SHALL select the node's stored value whenever the
selected configuration contains it, and SHALL select no value otherwise. Closing the
dialog with Done SHALL record a changed value reference as a modification of the node, and
closing it with Cancel SHALL leave the node unchanged.

#### Scenario: Switching back to the stored configuration
- **WHEN** a value node's edit dialog is opened, its configuration is switched to one that doesn't contain the stored value, and then switched back
- **THEN** the value list selects the stored value again

#### Scenario: Done without a value of the selected configuration
- **WHEN** the configuration is switched to one that doesn't contain the stored value and the dialog is closed with Done
- **THEN** the node references no value and the editor marks it as invalid

#### Scenario: Another value of the same configuration
- **WHEN** another value of the same configuration is selected and the dialog is closed with Done
- **THEN** the node references the new value, the flow is marked as modified, and undo restores the previous value

#### Scenario: Dialog cancelled
- **WHEN** the configuration and the value are changed and the dialog is closed with Cancel
- **THEN** the node keeps its configuration and value reference
