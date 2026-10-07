# Proposal

## Why

The value node's edit dialog gets the name and values of the selected configuration from a
registry in the backend. That registry only knows configurations that were deployed or
saved from their own edit dialog since the last Node-RED start. As a result, a flow that
was just imported (for example from Import → Examples) can't be set up before its first
deploy: the value list stays empty, and the examples carry a workaround comment for it.
The registry also keeps entries of configurations deleted in the editor until the next
restart, and those stale entries inflate the generated name for new configurations.

The editor already holds every configuration node with its `name` and `values`, including
undeployed ones and unsaved changes. Reading them there removes the registry and the
failure modes that come with it.

## What Changes

- The value node's edit dialog reads the selected configuration from the editor's own
  configuration node instead of requesting it from the backend. The value list works
  before the first deploy and reflects configuration changes that aren't deployed yet.
- The configuration node's edit dialog counts the other configuration nodes in the editor
  for the generated name `Persistent Values Config <N>`, instead of asking the backend.
- The configuration node's edit dialog no longer posts to the backend on save and delete.
- The examples drop their "*Important*: Make config available" comment. Its workaround,
  pressing Update in the configuration's dialog so `config/save` registers it with the
  backend, is no longer needed.
- **Removed**: the backend registry and the admin endpoints
  `GET /persistentvalues/config/get`, `POST /persistentvalues/config/save` and
  `POST /persistentvalues/config/delete`. Only this package's own editor uses them. The
  endpoints `GET /persistentvalues/config/generate_uuid` and
  `GET /persistentvalues/util/getcontextkey` stay.

Flows and already-persisted context data are unaffected. Value nodes keep referencing
values by UUID, and the runtime still reads configurations through
`RED.nodes.getNode`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `editor-backend-api`: removes the registry and the get, save and delete endpoints.
- `value-configuration`: the generated configuration name counts the configurations in
  the editor instead of those known to the backend.
- `value-node-setup`: adds a requirement that the value node's edit dialog offers the
  values of the configuration as currently defined in the editor.

## Impact

- `nodes/persistent-values-config.js`: registry and three endpoints removed.
- `nodes/persistent-values-config.html`: default name, save and delete hooks.
- `nodes/persistent-value.html`: configuration lookup in the edit dialog.
- `test/persistent_values_config_spec.js`: the eight endpoint tests are removed, and the
  UUID test stays.
- `examples/*.json`: the workaround comment node is removed from all four examples,
  including from its group's `nodes` list, and the layout is re-aligned so that after an
  import the comments and inject nodes line up and no node overlaps another.
- `CHANGELOG.md`: `#38` added to the `Miscellaneous Editor Fixes` entry.
- `openspec/specs/editor-backend-api/spec.md`: its Purpose still explains the registry and
  is reworded to the remaining endpoints.
