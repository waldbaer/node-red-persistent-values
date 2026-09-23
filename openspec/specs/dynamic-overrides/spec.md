# dynamic-overrides Specification

## Purpose

Defines how an incoming message can override the command and the addressed persistent value
configured on a `persistent value` node, so that one node can serve several values or
several commands.

## Requirements

### Requirement: Dynamic value override

When "Dynamic Control" is enabled, the node SHALL read the configured dynamic value message
property and, if it is set, address the persistent value whose name equals that property's
value instead of the configured one. The override applies to the whole message processing:
context key, scope, storage, datatype check, default value and reported metadata all follow
the overridden value.

#### Scenario: Value addressed by message property
- **WHEN** a node configured for the value `string` receives a message whose dynamic value property is `number`
- **THEN** the value `number` is read from the context and emitted

#### Scenario: Override also applies to writes
- **WHEN** a message overrides both the command to `write` and the value to `string`
- **THEN** the payload is persisted under the context key of `string`

### Requirement: Unknown dynamic value falls back to the configured value

If the dynamic value property names a value that does not exist in the referenced
configuration, the node SHALL log a warning containing the requested name, the value it
falls back to and the list of known value names, and SHALL continue with the configured
value.

#### Scenario: Unknown value name warns and falls back
- **WHEN** the dynamic value property is set to a name that is not configured
- **THEN** a warning naming the unknown value and the fallback is logged
- **THEN** the configured value is read

### Requirement: Value override requires Dynamic Control

The dynamic value override SHALL only be evaluated when "Dynamic Control" is enabled. With
"Dynamic Control" disabled, the dynamic value message property SHALL be ignored.

#### Scenario: Override ignored while dynamic control is off
- **WHEN** a node with "Dynamic Control" disabled receives a message carrying the dynamic value property
- **THEN** the configured value is used

#### Scenario: Enabled dynamic control without the property uses the configured value
- **WHEN** a node with "Dynamic Control" enabled receives a message without the dynamic value property
- **THEN** the configured value is used

### Requirement: Dynamic command override

The node SHALL read the configured dynamic command message property and, if it is set to
one of `read`, `write` or `reset`, execute that command instead of the configured one.
String values SHALL be trimmed and lower-cased before the comparison.

#### Scenario: Command overridden to read
- **WHEN** a node configured for `write` receives a message whose dynamic command property is `read`
- **THEN** the value is read and the context is not modified

#### Scenario: Command override is case- and whitespace-insensitive
- **WHEN** the dynamic command property carries `  Write  `
- **THEN** the `write` command is executed

### Requirement: Command override works without Dynamic Control

For backward compatibility with 1.x flows, the dynamic command override SHALL be evaluated
regardless of whether "Dynamic Control" is enabled. This asymmetry to the value override is
intentional; aligning it is a breaking 2.x change.

#### Scenario: Command override honoured while dynamic control is off
- **WHEN** a node with "Dynamic Control" disabled receives a message with the dynamic command property set to `read`
- **THEN** the `read` command is executed

### Requirement: Unknown dynamic command falls back to the configured command

If the dynamic command property carries a value that is not a supported command, the node
SHALL log a warning naming the unsupported command, the command it falls back to and the
list of supported commands, and SHALL execute the configured command.

#### Scenario: Unsupported command override warns and falls back
- **WHEN** the dynamic command property carries `delete`
- **THEN** a warning listing the supported commands is logged
- **THEN** the configured command is executed

### Requirement: Unsupported effective command aborts processing

If the command that is finally selected is not one of `read`, `write` or `reset` — which can
only happen when the node itself is configured with an unsupported command — the node SHALL
log an error naming the command and SHALL NOT emit anything on either output.

#### Scenario: Node configured with an unsupported command
- **WHEN** a value node configured with the command `unsupported command` receives a message
- **THEN** an error naming the unknown command is logged
- **THEN** no message is sent on any output

### Requirement: Default dynamic message properties

The dynamic command property SHALL default to `command`. For the dynamic value property the
editor stores `topic` for every node created since version 1.4.0, while the runtime falls
back to `value` when the node configuration carries no property at all. Documentation and
editor placeholder state `msg.topic`.

#### Scenario: Node configuration without a dynamic value property
- **WHEN** a node with "Dynamic Control" enabled has no `dynamicValueMsgProperty` stored in its configuration
- **THEN** the override is read from `msg.value`
