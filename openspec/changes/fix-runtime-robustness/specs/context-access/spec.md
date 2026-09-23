# Spec Delta

## ADDED Requirements

### Requirement: Unparsable JSON default aborts message processing

If the configured default of a `json` value cannot be parsed, the node SHALL log an error
naming the configuration and the value, passing the message along so that Catch nodes can
handle it, and SHALL abort processing of the message without producing any output or
writing the context. This SHALL apply to every message addressing that value, whether or not
a context entry exists, so that a broken configuration fails consistently rather than only
once the entry is missing or reset.

#### Scenario: Read of a value with a malformed JSON default
- **WHEN** a `json` value whose configured default is `{not json` is read
- **THEN** an error naming the configuration and the value is logged
- **THEN** neither output emits a message

#### Scenario: Persisted entry does not mask a malformed JSON default
- **WHEN** a `json` value whose configured default is `{not json` already has a context entry and a message reaches the node
- **THEN** an error naming the configuration and the value is logged
- **THEN** neither output emits a message and the context entry is unchanged
