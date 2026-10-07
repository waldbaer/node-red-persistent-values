# Spec Delta

## MODIFIED Requirements

### Requirement: Generated configuration name for new configurations

When a configuration node is opened without a name, the editor SHALL propose
`Persistent Values Config <N>`, where `<N>` is the number of other configuration nodes of
type `persistent values config` in the editor, deployed or not.

#### Scenario: Second configuration gets a generated name
- **WHEN** a new configuration node is opened while one configuration already exists
- **THEN** the name field is prefilled with `Persistent Values Config 1`

#### Scenario: Undeployed configurations are counted
- **WHEN** a new configuration node is opened while one configuration exists in the editor that has never been deployed
- **THEN** the name field is prefilled with `Persistent Values Config 1`
