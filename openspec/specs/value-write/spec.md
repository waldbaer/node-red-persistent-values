# value-write Specification

## Purpose

Defines the `write` command of the `persistent value` node: validating an incoming value
against the configured datatype, persisting it in the context store, and signalling actual
changes on the on-change output.

## Requirements

### Requirement: Write persists the input value

The `write` command SHALL take the value from the configured message property and store it
in the context under the derived context key, using the configured scope and storage.

#### Scenario: Value written to the default storage
- **WHEN** a message with `msg.payload = 'new value'` reaches a writing node for a `str` value
- **THEN** the context holds `'new value'` under the derived key

#### Scenario: Value written to a named storage
- **WHEN** the addressed value is configured with storage `file`
- **THEN** the value is stored in the `file` store and not in the `memory` store

### Requirement: Missing input property aborts the write

If the configured input message property is not present on the incoming message, the node
SHALL log an error naming the property, SHALL NOT write the context, and SHALL NOT emit any
output.

#### Scenario: Message without the configured input property
- **WHEN** a node configured to write `msg.non_existing` receives a message without that property
- **THEN** an error naming the missing property is logged
- **THEN** neither output emits a message

### Requirement: Datatype mismatch aborts the write

If the input value does not match the configured datatype, the node SHALL log an error
naming the property, the expected datatype, the configuration and the value, and SHALL NOT
write the context nor emit any output. Unlike a mismatch on read, a mismatch on write is an
error, because it would corrupt the persisted contract.

#### Scenario: String written into a boolean value
- **WHEN** a message with a string payload reaches a node writing a `bool` value
- **THEN** an error stating that the passed value does not have the configured datatype is logged
- **THEN** the context remains unchanged and no output is emitted

### Requirement: JSON values must be pure JSON

A value configured as `json` SHALL only accept data built from the JSON datatypes `null`,
boolean, string, number, array and plain objects. Any other datatype anywhere in the
structure SHALL be rejected as a datatype mismatch.

#### Scenario: Plain object accepted
- **WHEN** a nested object of strings, numbers, booleans, `null` and arrays is written to a `json` value
- **THEN** the object is stored unchanged

#### Scenario: Non-JSON datatype rejected
- **WHEN** an object containing a `BigInt` — or any other value that is not a JSON datatype, such as a function or a class instance — is written to a `json` value
- **THEN** an error stating that the value does not have the configured datatype `json` is logged
- **THEN** no message is sent on any output

### Requirement: Context is written only on an actual change

The node SHALL write the context only if the input value differs from the current value, or
if the current value is the configured default because no context entry exists yet. The
comparison SHALL be a deep strict equality check, so structurally equal JSON values count
as unchanged.

#### Scenario: Unchanged value is not rewritten
- **WHEN** the input value deep-equals the value already stored in the context
- **THEN** the context is not written and the on-change output emits nothing

#### Scenario: Value equal to the default is still persisted
- **WHEN** no context entry exists yet and the input value equals the configured default
- **THEN** the value is written to the context
- **THEN** the on-change output emits the message

### Requirement: On-change output signals context modification

Output 2 SHALL emit the message exactly when the `write` command modified the context
store, and SHALL emit `null` otherwise. Output 1 SHALL always emit the message carrying the
written value.

#### Scenario: Change notification on a modified value
- **WHEN** a value different from the persisted one is written
- **THEN** output 1 and output 2 both emit the message

#### Scenario: No change notification on an unmodified value
- **WHEN** a value equal to the persisted one is written
- **THEN** output 1 emits the message and output 2 emits `null`
