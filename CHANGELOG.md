# Changelog

All notable changes to this project will be documented in this file.

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
