# Design

## Context

See proposal.md for motivation. The facts that shape the approach:

- `name` and `values` are `defaults` of the `persistent values config` node, so the editor
  keeps them on its copy of every configuration node, deployed or not. Node-RED updates
  that copy when the configuration's edit dialog is confirmed, also when it was opened
  from the configuration field of another node's dialog.
- Core Node-RED nodes read their configuration nodes in the editor with
  `RED.nodes.node(id)`, for example the MQTT nodes with their broker.
- The registry has three writers: the configuration node's constructor at deploy, and the
  save and delete hooks of its edit dialog. It has two readers: the value node's edit
  dialog (one configuration) and the configuration node's edit dialog (all of them, only
  to count them for the generated name).
- The runtime never reads the registry. Value nodes resolve their configuration with
  `RED.nodes.getNode`.

## Goals / Non-Goals

**Goals:**
- One source of configuration data in the editor: the editor's own configuration nodes.
- No backend endpoint left that only mirrors editor state.

**Non-Goals:**
- Moving UUID generation or context key derivation to the editor. Both rely on runtime
  code (`uuid`, the context key derivation in `context-access`) and keep their endpoints.

## Decisions

### Read the configuration with `RED.nodes.node(id)`

The configuration select's change handler takes `name` and `values` from
`RED.nodes.node(selectedConfigId)`. The lookup is synchronous, so the handler no longer
awaits a request and `getConfigFromBackend` goes away.

When the ID doesn't resolve, the handler keeps the guard from
`fix-editor-config-load-failure` and logs the error naming the ID itself, since
`getConfigFromBackend` logged it so far.

Alternative: keep the registry and use the editor's copy only when the backend doesn't
know the configuration. Rejected, because two sources can disagree, for example after a
configuration was changed in the editor but not deployed.

### Count configurations with `RED.nodes.eachConfig`

The generated name counts nodes of type `persistent values config` other than the one
being edited. Excluding the node itself keeps the count right whether or not Node-RED has
already added a new configuration node to its node list when its dialog opens.

### Remove the registry completely

The configuration node's constructor keeps `name` and `values` on the runtime node, which
the value nodes need, but no longer stores them in the module-level `configs` object.
`configs` and the get, save and delete endpoints go away, along with their constants and
the save and delete hooks in `nodes/persistent-values-config.html`.

Alternative: keep the endpoints for anyone else who might call them. Rejected, because
they were never documented and only this package's editor calls them.

### Sequencing

This change lands after `fix-editor-config-load-failure`, whose guard for a configuration
that doesn't resolve the value node's edit dialog keeps.

## Risks / Trade-offs

- [An editor tab that was open during the upgrade still runs the old dialogs, which call
  the removed endpoints] → Node-RED asks for a reload after a palette update, and a reload
  loads the new dialogs.
- [`RED.nodes.node` is not part of the documented editor API] → Core nodes rely on it, so
  it is effectively stable. The manual checks cover the Node-RED version used in
  development.
- [The generated name changes for users with undeployed configurations] → It now counts
  them, which is what the requirement intends; the old count was an artifact of the
  registry.

## Migration Plan

None for users. Rollback is a revert of the change.
