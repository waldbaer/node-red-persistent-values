# Proposal

## Why

Re-checking the reverse-engineered specs against the code turned up four places where the
runtime fails differently from what the specs describe or intend. Two of them throw raw
`TypeError`/`SyntaxError`s from the input handler. One leaves stale entries in the backend
registry that the editor reads. One renders `[object Object]` into the node status. All four
are reachable with ordinary flows or settings, and each fix is small and local.

## What Changes

- **Collect Values with a `null` property**: a collection property that holds `null` is
  treated like a missing object and replaced by a new object. Today
  `collectedValues[contextKey] = …` throws a `TypeError` and the message is dropped.
- **Malformed JSON default**: when the configured `json` default cannot be parsed, the node
  logs an error naming the configuration and the value and skips further processing of the
  message. Today `JSON.parse` throws a raw `SyntaxError` on every message. The set of
  affected messages stays the same; only the diagnostic changes.
- **Backend registry pruning**: a configuration node that a deploy removes also removes its
  entry from the backend registry. Today the entry stays until Node-RED restarts, and the
  generated name for new configurations counts it.
- **Status with an object-form default store**: the status annotates the `default` storage
  with a store name only when `contextStorage.default` is a string alias. When it is a store
  definition such as `{module: 'memory'}`, the status shows plain `default` instead of
  `default ([object Object])`.

No breaking change. Flows and already-persisted context data are unaffected: context keys,
datatypes and the value reference by UUID or name stay as they are.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `value-collection`: the collection object is also created when the property holds `null`.
- `context-access`: a `json` default that cannot be parsed aborts message processing with a
  named error.
- `editor-backend-api`: the registry is also pruned when a deploy removes a configuration
  node.
- `node-status`: the default-store annotation applies only to a string alias.

## Impact

- `nodes/persistent-value.js`: `updateCollectedValues`, the input handler around
  `getDefaultValue`, and `buildNodeStatus`.
- `nodes/persistent-values-config.js`: a new `close` handler on the config node.
- `test/persistent_value_spec.js`, `test/persistent_values_config_spec.js`: new cases for
  every new branch, to keep nyc at 100%.
- `CHANGELOG.md`: entries under `[Unreleased]` → `Fixes`.
- No new dependency and no editor change. The close handler signature `(removed, done)` is
  available in all supported Node-RED versions (`>=1.3.0`).
