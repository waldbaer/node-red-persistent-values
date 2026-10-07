# Spec Delta

## ADDED Requirements

### Requirement: Value selection in the edit dialog

The value node's edit dialog SHALL change the node only when it is closed with Done. While
the dialog is open, the value list SHALL select the node's stored value whenever the
selected configuration contains it, and SHALL select no value otherwise. Closing the
dialog with Done SHALL record a changed value reference as a modification of the node, and
closing it with Cancel SHALL leave the node unchanged.

#### Scenario: Switching back to the stored configuration
- **WHEN** a value node's edit dialog is opened, its configuration is switched to one that doesn't contain the stored value, and then switched back
- **THEN** the value list selects the stored value again

#### Scenario: Done without a value of the selected configuration
- **WHEN** the configuration is switched to one that doesn't contain the stored value and the dialog is closed with Done
- **THEN** the node references no value and the editor marks it as invalid

#### Scenario: Another value of the same configuration
- **WHEN** another value of the same configuration is selected and the dialog is closed with Done
- **THEN** the node references the new value, the flow is marked as modified, and undo restores the previous value

#### Scenario: Dialog cancelled
- **WHEN** the configuration and the value are changed and the dialog is closed with Cancel
- **THEN** the node keeps its configuration and value reference
