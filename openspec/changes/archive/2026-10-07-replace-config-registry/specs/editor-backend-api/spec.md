# Spec Delta

## REMOVED Requirements

### Requirement: Configurations are mirrored in the backend
**Reason**: The edit dialogs read configurations from the editor's own configuration nodes,
which also covers configurations that are not deployed yet.
**Migration**: None for flows. Editor code reads the configuration node with
`RED.nodes.node(id)` instead.

### Requirement: Get configurations
**Reason**: Without the registry there is nothing to return; the edit dialogs read
configurations in the editor.
**Migration**: Use `RED.nodes.node(id)` in the editor for a single configuration, or
iterate the configuration nodes of type `persistent values config` for all of them.

### Requirement: Save configuration
**Reason**: The editor's configuration node is the only copy the edit dialogs need, and
Node-RED updates it when its edit dialog is confirmed.
**Migration**: None. The configuration node's edit dialog no longer posts on save.

### Requirement: Delete configuration
**Reason**: Without the registry there is nothing to delete.
**Migration**: None. The configuration node's edit dialog no longer posts on delete.
