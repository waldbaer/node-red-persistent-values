# deep-clone Specification

## Purpose

Defines the "Deep Clone Value" option, which isolates the persisted value from the messages
flowing through the node so that mutating a message cannot silently mutate the context
store and vice versa.

## Requirements

### Requirement: Deep clone is opt-in

Deep cloning SHALL be disabled by default. With deep cloning disabled, structured values are
passed by reference between context store and message, which is the behaviour of all
versions before the option existed.

#### Scenario: Option defaults to disabled
- **WHEN** a value node is deployed without `deepCloneValue`
- **THEN** values are passed without cloning

### Requirement: Read returns an isolated copy

With deep cloning enabled, the value emitted by a `read` SHALL be a deep copy, so that a
downstream node modifying the message does not modify the persisted value.

#### Scenario: Downstream modification leaves the store untouched
- **WHEN** a `json` value is read with deep cloning enabled and a downstream node modifies the emitted object
- **THEN** the value in the context store is unchanged

### Requirement: Write stores an isolated copy

With deep cloning enabled, the value persisted by a `write` SHALL be a deep copy of the
input, so that a later modification of the original message object does not modify the
persisted value.

#### Scenario: Later modification of the input leaves the store untouched
- **WHEN** a `json` object is written with deep cloning enabled and the original object is modified afterwards
- **THEN** the value in the context store is unchanged

### Requirement: Reset emits an isolated copy of the default

With deep cloning enabled, the value emitted by a `reset` SHALL be a deep copy of the
configured default value.

#### Scenario: Downstream modification after reset leaves the store untouched
- **WHEN** a `json` value is reset with deep cloning enabled and a downstream node modifies the emitted object
- **THEN** the value in the context store still equals the configured default
