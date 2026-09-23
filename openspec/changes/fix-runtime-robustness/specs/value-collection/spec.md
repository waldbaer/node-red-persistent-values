# Spec Delta

## MODIFIED Requirements

### Requirement: Values are collected under their context key

When enabled, the node SHALL add an entry to an object on the configured collection message
property, keyed by the derived context key of the addressed value. The object SHALL be
created if the property does not yet hold one. A property holding `null` does not hold an
object and SHALL be replaced by a new object as well.

#### Scenario: Collected read value
- **WHEN** a reading node with collection enabled handles the value `boolean` of configuration `TestConfig`
- **THEN** the collection property carries an object with the key `TestConfig_boolean`

#### Scenario: Collected written value holds the new value
- **WHEN** a writing node with collection enabled persists `'new'`
- **THEN** the collection entry for that value is `'new'`

#### Scenario: Collection property holding null
- **WHEN** a reading node with collection enabled receives a message whose collection property is `null`
- **THEN** the collection property carries a new object with the entry of the addressed value
- **THEN** no error is logged and the message is emitted
