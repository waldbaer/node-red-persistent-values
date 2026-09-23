# Design

## Context

All four fixes are local to one function or handler (see proposal.md, Impact). Two constraints
shape them:

- Node-RED wraps every input handler in a `try`/`catch` and reports a thrown error through
  `node.error(err, msg)`. The two crashes therefore already drop the message and trigger
  Catch nodes. What they lack is a diagnostic that names the configuration and the value.
- nyc enforces 100% branch coverage, so every new branch needs its own test case.

## Goals / Non-Goals

**Goals:**
- Replace the two raw exceptions with defined behaviour: collect for `null`, and a named
  error for a malformed default.
- Keep the backend registry equal to the set of deployed or editor-saved configurations.
- Keep the set of messages that are processed or dropped unchanged, except for the `null`
  collection case, which now succeeds.

**Non-Goals:**
- Validating JSON defaults at deploy time. The editor already rejects them. A malformed
  default only reaches the runtime through a hand-edited or imported flow.
- Treating arrays at the collection property differently. They are objects and keep
  receiving entries as properties.
- Annotating the status when `contextStorage` has no `default` key, although Node-RED then
  uses the first listed store.
- The unresolved value reference (a UUID or name that is not in the configuration). That is
  a separate follow-up.

## Decisions

### Parse the JSON default on every message and abort on failure

The input handler keeps calling `getDefaultValue` for every message, and wraps the call. On
a `SyntaxError` it logs through `logger.logError(…, node, msg)` and returns.

- *Alternative: parse only when needed* (no context entry, or `reset`). Reads and writes of
  an already persisted value would then keep working with a broken default. This was
  rejected for two reasons. It hides a configuration error until the entry disappears or a
  reset happens, which is the worst moment to find it. It also changes which messages are
  processed, while the eager variant changes only the diagnostic.
- Passing `msg` to `logError` keeps today's Catch-node behaviour. The raw exception
  currently reaches Catch nodes through Node-RED's wrapper.

### Treat `null` like a missing collection object

The guard changes from `collectedValues === undefined || typeof collectedValues !== 'object'`
to `collectedValues === null || typeof collectedValues !== 'object'`. `undefined` is still
covered by the `typeof` test, so the condition stays a single expression. A `null`
*intermediate* property, as in `payload.values` with `msg.payload = null`, is still refused
by `RED.util.setMessageProperty` and still takes the existing warning path.

### Prune the registry in the config node's `close(removed, done)` handler

`delete configs[node.id]` runs only when `removed` is true. A modified or full deploy and a
runtime shutdown close the node with `removed` false and re-create it, and the constructor
registers it again. Pruning on every close would mostly be repaired by that
re-registration. Still, `removed` is Node-RED's exact signal that the configuration no longer
exists, and it avoids a transient 404 for the editor while a deploy restarts the node.

- *Alternative: rely on the editor's `oneditdelete`*. This is not enough. It only fires when
  the configuration is deleted from its own edit dialog, not when it is removed through the
  config sidebar or by importing or replacing flows.

### Annotate the default store only for a string alias

`RED.settings.contextStorage.default !== undefined` becomes
`typeof RED.settings.contextStorage.default === 'string'`. With an inline store definition,
the store Node-RED uses is literally named `default`, so there is nothing to resolve.

## Risks / Trade-offs

- [A config node closed with `removed` true while its edit dialog is still open in another
  browser tab] → That dialog's next save re-registers it through the save endpoint. This
  matches what `oneditdelete` already does today.
- [`node.error` without `msg` would not reach Catch nodes] → `msg` is passed explicitly, and
  a test asserts it.
