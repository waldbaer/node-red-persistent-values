# previous-value-output Specification

## Purpose

Defines the "Output Previous Value" option, which exposes the value a persistent value held
before a `write` or `reset`, so that flows can react to the transition rather than only to
the new value.

## Requirements

### Requirement: Previous value is emitted on write and reset

When enabled, the node SHALL write the value read from the context before the command was
executed to the configured previous-value message property. The property SHALL be written
for the `write` and `reset` commands.

#### Scenario: Previous value on write
- **WHEN** a node with the option enabled writes `'new'` over a persisted `'old'`
- **THEN** the configured previous-value property carries `'old'`

#### Scenario: Previous value on reset
- **WHEN** a node with the option enabled resets a value holding `'old'`
- **THEN** the configured previous-value property carries `'old'`

### Requirement: No previous value on read

The `read` command SHALL NOT write the previous-value property, because a read has no
previous state to report.

#### Scenario: Read leaves the property absent
- **WHEN** a node with the option enabled reads a value
- **THEN** the emitted message does not carry the previous-value property

### Requirement: Configurable and nested previous-value property

The previous-value property SHALL be configurable, SHALL default to `previous_value` and
SHALL support nested message properties with creation of missing intermediate objects.

#### Scenario: Nested previous-value property
- **WHEN** the property is configured as `output.store_previous_value`
- **THEN** the previous value is written to `msg.output.store_previous_value`

### Requirement: Previous-value property must not collide

The editor SHALL reject a node configuration in which the previous-value property equals the
input/output property or the value-collection property.

#### Scenario: Colliding properties rejected
- **WHEN** the previous-value property is set to the same name as the input/output property
- **THEN** the node configuration fails editor validation
