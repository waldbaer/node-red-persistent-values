# block-flow Specification

## Purpose

Defines the "Block Further Flow Processing" option, which turns a `persistent value` node
into a gate: the message is discarded when the handled value matches — or does not match —
a configured compare value.

## Requirements

### Requirement: Blocking discards both outputs

When the configured rule matches, the node SHALL emit `null` on both outputs, so that
neither the current-value nor the on-change branch of the flow continues. Any context write
performed by the command itself SHALL still have taken place.

#### Scenario: Matching rule blocks the message
- **WHEN** a node with an enabled, matching block-if rule handles a message
- **THEN** both outputs emit `null`

#### Scenario: Non-matching rule passes the message
- **WHEN** the configured rule does not match the current value
- **THEN** output 1 emits the message as usual

### Requirement: Equality and inequality rules

The node SHALL support the rules `eq` and `neq`. Both SHALL compare the current value
against the configured compare value with a deep strict equality check, so that structured
`json` values are compared by content. The default rule is `eq`.

#### Scenario: Equal rule on a scalar value
- **WHEN** the rule is `eq`, the compare value is `true` and the current value is `true`
- **THEN** the message is blocked

#### Scenario: Equal rule on a JSON value
- **WHEN** the rule is `eq` and the current `json` value deep-equals the configured compare object
- **THEN** the message is blocked

#### Scenario: Not-equal rule
- **WHEN** the rule is `neq` and the current value differs from the compare value
- **THEN** the message is blocked

### Requirement: Compare value is converted to the configured datatype

The compare value is entered as text in the editor and SHALL be converted once, at node
setup, to the datatype configured for the statically selected value: `bool` accepts only the
texts `true` and `false`, `num` is converted with `Number()`, `str` is taken as text, and
`json` is parsed. The conversion SHALL be performed only when blocking is enabled.

#### Scenario: Boolean compare value converted from text
- **WHEN** the compare value `"true"` is configured for a `bool` value
- **THEN** it is compared as the boolean `true`

#### Scenario: Conversion uses the statically configured value
- **WHEN** a node with blocking enabled handles a message that dynamically overrides the addressed value
- **THEN** the compare value is still the one converted for the statically configured value's datatype

### Requirement: Unconvertible compare value disables blocking

If the compare value cannot be converted to the configured datatype, the node SHALL log an
error naming the value and the expected datatype at setup, and SHALL NOT block any message
afterwards.

#### Scenario: Non-numeric compare value for a number
- **WHEN** a `num` value is configured with the compare value `not a number`
- **THEN** a conversion error is logged and no message is blocked

#### Scenario: Malformed JSON compare value
- **WHEN** a `json` value is configured with a compare value that is not valid JSON
- **THEN** a conversion error is logged and no message is blocked

#### Scenario: Unsupported datatype
- **WHEN** the addressed value carries a datatype that is not supported
- **THEN** an error naming the unsupported compare value type is logged and no message is blocked

### Requirement: Type mismatch disables blocking for that message

If the JavaScript type of the current value differs from that of the compare value, the node
SHALL log a warning naming both types and SHALL NOT block the message.

#### Scenario: Compare value of a different type
- **WHEN** the current value is a string while the compare value is a number
- **THEN** a warning naming both types is logged and the message passes

### Requirement: Unknown rule disables blocking for that message

If the configured rule is neither `eq` nor `neq`, the node SHALL log a warning naming the
rule and SHALL NOT block the message.

#### Scenario: Unsupported rule configured
- **WHEN** the block-if rule is set to an unsupported value
- **THEN** a warning naming the rule is logged and the message passes
