# Spec Delta

## ADDED Requirements

### Requirement: Referenced value must exist

A `persistent value` node SHALL resolve its value reference, by `valueId` or by the
deprecated name in `value`, to a value of the referenced configuration. If no value of the
configuration matches, setup SHALL be aborted in the same way as for a missing
configuration: the node logs an error naming the node and its ID, and registers no input
handler.

#### Scenario: Valid UUID missing from the configuration
- **WHEN** a value node is deployed with a valid UUID in `valueId` that no value of its configuration has
- **THEN** an error matching `Incorrect or inconsistent configuration` is logged
- **THEN** the node has no registered input callback

#### Scenario: Name missing from the configuration
- **WHEN** a value node is deployed without `valueId` and with a name in `value` that no value of its configuration has
- **THEN** an error matching `Incorrect or inconsistent configuration` is logged
- **THEN** the node has no registered input callback
