# metadata-output Specification

## Purpose

Defines the "Output Meta Data" option, which attaches the configuration of the handled
persistent value to the outgoing message so that downstream nodes can act on the value's
declaration rather than only on its value.

## Requirements

### Requirement: Metadata content

When enabled, the node SHALL write an object to the configured metadata message property
carrying the members `config`, `value`, `datatype`, `default`, `scope`, `storage`,
`description` and `command`.

#### Scenario: Metadata of a read value
- **WHEN** a reading node with the option enabled handles the `num` value `number` of configuration `TestConfig`
- **THEN** the metadata property carries the configuration name, value name, datatype, configured default, scope, storage, description and the command `read`

### Requirement: Metadata reflects the effective value and command

The metadata SHALL describe the value and the command that were actually executed, including
any dynamic override, not the ones statically configured on the node.

#### Scenario: Metadata after a dynamic value override
- **WHEN** a node configured for the value `string` handles a message overriding the value to `number`
- **THEN** the metadata names `number` with its datatype, default, scope and storage

#### Scenario: Metadata after a dynamic command override
- **WHEN** a node configured for `read` handles a message overriding the command to `write`
- **THEN** the metadata reports the command `write`

### Requirement: Missing description is reported as an empty string

A value configured without a description SHALL be reported with an empty `description`
member rather than with `undefined`.

#### Scenario: Value without description
- **WHEN** metadata is emitted for a value whose configuration carries no description
- **THEN** the `description` member is the empty string

### Requirement: No metadata when the flow is blocked

If the block-if rule discards the message, no metadata SHALL be observable, because no
message is emitted at all. The node SHALL handle this without raising an error.

#### Scenario: Blocked message emits nothing despite metadata being enabled
- **WHEN** a node with metadata output enabled blocks the flow via a matching block-if rule
- **THEN** both outputs emit `null` and no error is logged

### Requirement: Configurable metadata property

The metadata property SHALL be configurable and SHALL default to `meta`.

#### Scenario: Custom metadata property
- **WHEN** the property is configured as `meta_data`
- **THEN** the metadata object is placed at `msg.meta_data`
