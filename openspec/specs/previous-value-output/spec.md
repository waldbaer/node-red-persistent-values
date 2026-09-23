# previous-value-output Specification

## Purpose

Defines the "Output Previous Value" option, which exposes the value a persistent value held
before a `write` or `reset`, so that flows can react to the transition rather than only to
the new value.

## Requirements

### Requirement: Previous value is emitted on write and reset

When enabled, the node SHALL write the current value before the command was executed to the
configured previous-value message property. The property SHALL be written for the `write`
and `reset` commands. If the context holds no entry, the previous value SHALL be the
configured default (see `context-access`), never `undefined`.

#### Scenario: Previous value on write
- **WHEN** a node with the option enabled writes `'new'` over a persisted `'old'`
- **THEN** the configured previous-value property carries `'old'`

#### Scenario: Previous value of an absent entry is the default
- **WHEN** a node with the option enabled resets a value that has no context entry
- **THEN** the configured previous-value property carries the configured default

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

### Requirement: Output properties must not collide

The editor SHALL reject a node configuration in which any two of the input/output property,
the previous-value property and the value-collection property are equal. The previous-value
and value-collection properties SHALL take part only while their option is enabled. The
metadata property is not part of this check. The check is evaluated on the input/output
property field and only while the node's edit dialog is open.

#### Scenario: Colliding properties rejected
- **WHEN** the previous-value property is set to the same name as the input/output property
- **THEN** the node configuration fails editor validation

#### Scenario: Collection property colliding with the input/output property
- **WHEN** value collection is enabled and its property equals the input/output property
- **THEN** the node configuration fails editor validation

#### Scenario: Disabled option does not collide
- **WHEN** the previous-value property equals the input/output property but the option is disabled
- **THEN** the node configuration passes editor validation
