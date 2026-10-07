# Proposal

## Why

The value node's edit dialog reads the selected configuration from the backend with
`getConfigFromBackend`. When that lookup doesn't resolve, the configuration select's change
handler throws a `TypeError` on the missing configuration's `name`. This happens for a value
node that was imported without its configuration node, where Node-RED leaves the
configuration field without a selection (`null`), and for a configuration that exists in the
editor but isn't deployed yet. The node's stored value reference only survives because the
exception aborts the handler before it touches the value list.

## What Changes

- When the selected configuration doesn't resolve, the dialog logs an error naming the
  configuration ID, empties and disables the value list, and hides the value tip and the
  deep-clone option. It doesn't throw. `getConfigFromBackend` already logs that error.
- The node's stored value reference stays unchanged, so closing the dialog with Done
  doesn't lose it.

No runtime change. Flows and already-persisted context data are unaffected. The change
doesn't depend on `replace-config-registry`. When that change later reads the configuration
with `RED.nodes.node`, it keeps this guard and logs the error itself, because
`getConfigFromBackend` goes away.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `value-node-setup`: adds a requirement for the value node's edit dialog when its
  configuration can't be resolved.

## Impact

- `nodes/persistent-value.html`: the configuration select's change handler.
- `CHANGELOG.md`: a `Fixes` entry.
- The editor scripts are not covered by the mocha suite, so verification is a manual check
  in the Node-RED editor.
