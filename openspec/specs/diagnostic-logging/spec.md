# diagnostic-logging Specification

## Purpose

Defines how the package reports warnings and errors, so that diagnostics are recognizable in
the Node-RED debug sidebar and usable from both the runtime and the editor.

## Requirements

### Requirement: Shared logger for runtime and editor

Warnings and errors SHALL be emitted through `resources/logger.js`, which is loadable both
as a CommonJS module in the Node.js runtime and as a plain script in the editor's browser
context.

#### Scenario: Logger usable from the runtime
- **WHEN** the module is required in Node.js
- **THEN** it exposes `logWarning` and `logError`

### Requirement: Messages carry the package prefix

Every logged message SHALL be prefixed with `[Persistent Values] `, so that diagnostics of
this package are identifiable among messages of other nodes.

#### Scenario: Prefixed warning
- **WHEN** a warning is logged
- **THEN** the emitted text starts with `[Persistent Values] `

### Requirement: Node-scoped logging routes to the debug sidebar

When a node is passed, the logger SHALL emit through that node's `warn` and `error`
functions, so that the message appears in the Node-RED debug sidebar and is attributed to
the node. The message that triggered the diagnostic MAY be passed along for debug context.

#### Scenario: Warning routed through the node
- **WHEN** `logWarning` is called with a node
- **THEN** the node's `warn` function is called with the prefixed message

#### Scenario: Error routed through the node
- **WHEN** `logError` is called with a node
- **THEN** the node's `error` function is called with the prefixed message

### Requirement: Console fallback without a node

When no node is passed — as in the editor, and during node setup before a node exists — the
logger SHALL emit through `console.warn` and `console.error`.

#### Scenario: Warning without a node
- **WHEN** `logWarning` is called without a node
- **THEN** `console.warn` is called with the prefixed message

#### Scenario: Error without a node
- **WHEN** `logError` is called without a node
- **THEN** `console.error` is called with the prefixed message
