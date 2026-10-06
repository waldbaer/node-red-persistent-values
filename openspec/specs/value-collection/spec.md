# value-collection Specification

## Purpose

Defines the "Collect Values" option, which accumulates the values handled by a chain of
`persistent value` nodes into a single message property, so that a flow can gather several
persistent values into one message.

## Requirements

### Requirement: Values are collected under their context key

When enabled, the node SHALL add an entry to an object on the configured collection message
property, keyed by the derived context key of the addressed value. The object SHALL be
created if the property does not yet hold one.

#### Scenario: Collected read value
- **WHEN** a reading node with collection enabled handles the value `boolean` of configuration `TestConfig`
- **THEN** the collection property carries an object with the key `TestConfig_boolean`

#### Scenario: Collected written value holds the new value
- **WHEN** a writing node with collection enabled persists `'new'`
- **THEN** the collection entry for that value is `'new'`

### Requirement: Chained nodes accumulate into one object

Several `persistent value` nodes wired in sequence and configured with the same collection
property SHALL accumulate their entries in the same object, because each node reuses an
object already present on the message.

#### Scenario: Two nodes collect into one object
- **WHEN** a string value node is wired into a number value node and both collect into `msg.collected_values`
- **THEN** the emitted message carries both entries in `msg.collected_values`

### Requirement: Entry shape depends on the previous-value option

If "Output Previous Value" is enabled on the same node, the collected entry SHALL be an
object `{current, previous}` instead of the bare current value. On a `read` this makes the
entry `{current: <value>}` with no `previous` member, even though a read emits no previous
value of its own.

#### Scenario: Write collects current and previous
- **WHEN** a writing node with both options enabled persists `'new'` over `'old'`
- **THEN** the collection entry is `{current: 'new', previous: 'old'}`

#### Scenario: Read collects only a current member
- **WHEN** a reading node with both options enabled handles a value of `true`
- **THEN** the collection entry is an object whose `current` member is `true` and which has no `previous` member

### Requirement: Collection is skipped when the property cannot be created

If the collection object cannot be created because an intermediate message property is not
an object, the node SHALL log a warning naming the property and SHALL continue processing
the message without collecting.

#### Scenario: Collection under a non-object parent property
- **WHEN** collection is configured as `payload.collected_values` while `msg.payload` holds a string
- **THEN** a warning stating that the object could not be created is logged
- **THEN** the message is still emitted with the command's own result

### Requirement: Configurable and nested collection property

The collection property SHALL be configurable, SHALL default to `values` and SHALL support
nested message properties.

#### Scenario: Nested collection property
- **WHEN** the property is configured as `output.collected_values`
- **THEN** the collected object is placed at `msg.output.collected_values`
