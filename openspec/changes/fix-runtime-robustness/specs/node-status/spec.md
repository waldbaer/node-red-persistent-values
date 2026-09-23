# Spec Delta

## MODIFIED Requirements

### Requirement: Default storage is annotated with the resolved store

When the addressed value uses the storage `default` and `contextStorage.default` in the
Node-RED settings names another store, as in `default: 'memory'`, the status SHALL append
that store name in parentheses. When `contextStorage.default` is itself a store definition,
as in `default: {module: 'memory'}`, the store is named `default` and the status SHALL show
`default` without an annotation.

#### Scenario: Resolved default store shown
- **WHEN** `contextStorage.default` is `memory` and a value with storage `default` is handled
- **THEN** the status text ends with `default (memory)]`

#### Scenario: No default store configured
- **WHEN** no `contextStorage.default` is configured
- **THEN** the status text ends with `default]`

#### Scenario: Default store defined inline
- **WHEN** `contextStorage.default` is `{module: 'memory'}` and a value with storage `default` is handled
- **THEN** the status text ends with `default]`
