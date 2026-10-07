# Spec Delta

## ADDED Requirements

### Requirement: Value selection uses the configuration as edited

The value node's edit dialog SHALL offer the values of the selected configuration as they
are currently defined in the editor, including configurations that have not been deployed
and changes to them that have not been deployed yet.

#### Scenario: Imported flow before the first deploy
- **WHEN** a flow with a configuration and a value node is imported and the value node's edit dialog is opened before deploying
- **THEN** the value list offers the configuration's values with the node's stored value selected

#### Scenario: Undeployed change to the configuration
- **WHEN** a value is added to a deployed configuration in its edit dialog and a value node's edit dialog is opened before deploying
- **THEN** the value list offers the added value

#### Scenario: New configuration created from the value node's dialog
- **WHEN** the user creates a new configuration through the configuration field of the value node's edit dialog and confirms it
- **THEN** the value list offers the new configuration's values
