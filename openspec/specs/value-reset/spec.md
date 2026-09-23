# value-reset Specification

## Purpose

Defines the `reset` command of the `persistent value` node: restoring a persistent value to
its configured default value and reporting the restored value downstream.

## Requirements

### Requirement: Reset restores the configured default

The `reset` command SHALL write the configured default value into the context and SHALL
write that value to the configured output message property.

#### Scenario: Non-default value is reset
- **WHEN** the context holds a value differing from the configured default and a message reaches a resetting node
- **THEN** the context holds the configured default afterwards
- **THEN** `msg.payload` carries the configured default

#### Scenario: Reset of an absent value persists the default
- **WHEN** the context holds no entry for the addressed value
- **THEN** the configured default is written to the context
- **THEN** the on-change output emits the message

### Requirement: Reset is skipped when the value already equals the default

If a context entry exists and already deep-equals the configured default, the node SHALL
NOT write the context and SHALL NOT emit on the on-change output. The current value is
still emitted on output 1.

#### Scenario: Already-default value is not rewritten
- **WHEN** the context holds a value deep-equal to the configured default
- **THEN** the context is not written and the on-change output emits `null`
- **THEN** output 1 still emits the message carrying the default value

### Requirement: Reset reports the replaced value as previous value

The value read from the context before the reset SHALL be treated as the previous value for
the previous-value output and for value collection, even when the reset is skipped.

#### Scenario: Previous value output on reset
- **WHEN** a node with previous-value output enabled resets a value holding `'old'`
- **THEN** the configured previous-value property carries `'old'`
