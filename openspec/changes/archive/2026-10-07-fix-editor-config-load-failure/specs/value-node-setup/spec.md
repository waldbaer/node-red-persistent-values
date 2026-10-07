# Spec Delta

## ADDED Requirements

### Requirement: Configuration missing in the edit dialog

When the configuration selected in the value node's edit dialog can't be resolved, the
dialog SHALL log an error without a node that names the configuration ID, SHALL empty and
disable the value list and hide the value tip, and SHALL leave the node's stored value
reference unchanged.

#### Scenario: Value node imported without its configuration
- **WHEN** a value node whose configuration is not part of the editor's flows is imported and its edit dialog is opened
- **THEN** the dialog shows no uncaught error, the value list is empty and disabled, and the value tip is hidden
- **AND** if the dialog's configuration field still carries the missing ID, an error prefixed with `[Persistent Values] ` names that ID in the browser console

#### Scenario: Stored value reference kept
- **WHEN** the dialog from the previous scenario is closed with Done
- **THEN** the node still references the same value
