# value-read Specification

## Purpose

Defines the `read` command of the `persistent value` node: exposing the currently persisted
value of a configured persistent value on a message property, without modifying the store.

## Requirements

### Requirement: Read outputs the current value

The `read` command SHALL write the current value of the addressed persistent value to the
configured message property and SHALL emit the message on output 1. `read` is the default
command of a value node.

#### Scenario: Persisted value is output
- **WHEN** the context holds `42` for a `num` value and a message reaches a reading node
- **THEN** `msg.payload` is `42`

#### Scenario: Default value is output when nothing is persisted
- **WHEN** the context holds no entry and the value's configured default is `true`
- **THEN** `msg.payload` is `true`

### Requirement: Configurable and nested output property

The output property SHALL be configurable and SHALL support nested message properties.
Missing intermediate objects SHALL be created.

#### Scenario: Read into a non-default property
- **WHEN** a reading node is configured with message property `output.value`
- **THEN** the current value is written to `msg.output.value`

### Requirement: Read never modifies the context

The `read` command SHALL NOT write to the context store and SHALL NOT emit anything on the
on-change output, regardless of whether the current value came from the store or from the
configured default.

#### Scenario: Reading an absent value does not persist the default
- **WHEN** a value with no context entry is read
- **THEN** the context still holds no entry afterwards
- **THEN** the on-change output emits nothing

### Requirement: Persisted data of the wrong datatype is read as is

A persisted value that does not match the configured datatype SHALL be output unchanged. The
accompanying warning is defined in `context-access`, because it applies to every command.

#### Scenario: Persisted string under a boolean configuration
- **WHEN** the context holds the string `'not a boolean'` for a value configured as `bool`
- **THEN** the message is still emitted carrying that string
