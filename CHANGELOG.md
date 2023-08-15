# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - not yet released

### Features
- Support possibility to add a description for every configured value.
- Support scope 'Node'.

## [1.4.0] - 2023-06-07

### Features
- Support dynamic override of configured 'Value' with configurable `msg` property.
- Support configurable `msg` property for dynamic 'Command' override.

## [1.3.1] - 2023-04-03

### Improvements
- Editor: CSS

### Fixes
- Write input value to context store even if it is equal to the configured default value.


## [1.3.0] - 2023-02-22

### Features
- Support datatype 'JSON'.

### Improvements
- Editor: CSS

### Fixes
- Support nested message properties for Input/Output, Output Previous Value, Collect Values.


## [1.2.0] - 2023-02-11

### Features
- Support output of previous persisted value into a configurable `msg` property.

### Improvements
- Editor: Tip showing the actual context variable name.
- Editor: CSS

### Fixes
- The configured 'Block Further Flow Processing' rule is not loaded into the editor.
  On second edit of the node the default rule '==' is stored again.
  Only relevant if rule `!=` is used.
  Workaround: Select the rule `!=` always before saving modified nodes.


## [1.1.1] - 2023-02-05

### Fixes
- Selected value is lost if the configured value is renamed.

  **Background:**

  Instead of the value name an UUID is now used to identify the selected value.

  **Migration Steps:**

  Old configurations without the UUID can still be loaded,
  but value renaming is not working without the following migration steps:

  - Open all existing persistent values config nodes and press 'Update'
  - Open all persistent value nodes and press 'Done'.
  - For now on the selected value should be automatically updated even if the value got renamed.

## [1.1.0] - 2023-02-02

### Features
- Support override of the configured command (read or write) by `msg.command` property.

### Improvements
- Add configuration name to default node name.
- Node status color indicates 'Block further flow processing' state.
- New example flows for 'Collect Multiple Values' and 'Dynamic Command Override'

### Fixes
- Selected Value Drop-Down menu in the editor sporadically empty.


## [1.0.0] - 2023-01-25

Initial version of persistent values!

### Features

- Central configuration of all known persistent values (states, config options, ...).
  - Dataypes: Bool, Number, String
  - Default value
  - Scope and Storage type
- Node to read and write a concrete persistent value referenced via the config.
- Configurable `msg` property for input of new persistent value or output of the current value.
- Append the current persistent value as object attribute to an configurable `msg` property.
- Block further flow processing (no output) if the current value matches with a configured rule.
