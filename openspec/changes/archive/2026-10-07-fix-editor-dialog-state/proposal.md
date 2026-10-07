# Proposal

## Why

In the value node's edit dialog, the change handler of the configuration select field
stores the configuration it loads from the backend in `backendConfig`, which is never
declared. Because the editor scripts are not in strict mode, this silently creates a
`window.backendConfig` property, so the last loaded configuration leaks into the global
scope of the whole Node-RED editor, where any other script can read or overwrite it.

The change handlers of the configuration and value select fields also write the selected
configuration name, value ID and value name directly to the edited node instead of only to
the dialog's input fields. The node is therefore changed while the dialog is still open,
which breaks the dialog in three ways:

- Switching to a configuration that doesn't contain the selected value clears the node's
  value reference. Switching back to the original configuration then selects no value.
- Cancel doesn't discard these writes, because Node-RED only discards the input fields.
- Done records a change only when an input field differs from the node. Selecting another
  value of the same configuration therefore doesn't mark the flow as modified, and the
  change can't be undone.

## What Changes

- `backendConfig` becomes a local `const` of the change handler. Nothing else reads it.
- The change handlers write the selected configuration name, value ID and value name only
  to the dialog's input fields, and Node-RED copies them to the node on Done. While the
  dialog is open, the node keeps its stored value reference, so the value list selects it
  again whenever the selected configuration contains it.

No runtime change. Flows and already-persisted context data are unaffected: with no value
selected, Done still clears the value reference as before. This change does not depend on
`migrate-eslint-10`, but should land before it, because ESLint 10's `no-undef` rule
reports the undeclared variable.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `value-node-setup`: adds a requirement for how the value node's edit dialog selects the
  value and when it changes the node. The missing `window` property is not covered by a
  spec.

## Impact

- `nodes/persistent-value.html`: the change handlers of the configuration and value select
  fields.
- `CHANGELOG.md`: a `Fixes` entry.
- `replace-config-registry` and `fix-editor-config-load-failure` edit the same
  configuration change handler. Both keep working on top of this change: the first only
  replaces where `name` and `values` come from, and the second's empty value list still
  clears the reference on Done.
- The editor scripts are not covered by the mocha suite, so verification is a manual check
  in the Node-RED editor.
