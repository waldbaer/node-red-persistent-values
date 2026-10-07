# Proposal

## Why

A value node whose value reference doesn't match any value of its configuration crashes
instead of reporting the problem. This happens when a value is deleted from a configuration
while value nodes still reference it, and the value nodes are not opened and saved again.

- With a valid `valueId` that the configuration doesn't contain, setup throws a
  `TypeError` on `node.valueConfig.name`, and Node-RED reports the raw exception at deploy.
- With the deprecated reference by name (flows from 1.1.0 and earlier) and a name the
  configuration doesn't contain, setup succeeds. Every message without a dynamic value
  override then throws a `TypeError`, and so does setup if block-if is enabled.

## What Changes

- A value reference that cannot be resolved in the configuration aborts setup in the same
  way as a missing configuration or a malformed UUID: the node logs
  `Incorrect or inconsistent configuration`, names the node and its ID, and registers no
  input handler.
- This applies to both reference forms, the UUID and the deprecated name.

Flows and already-persisted context data are unaffected. A node whose reference resolves
behaves exactly as before. A node with an unresolvable reference by name stops processing
messages at all, also those with a dynamic value override, which today work by accident
while all other messages throw. The dynamic override is defined as falling back to the
configured value, so it presupposes that this value exists.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `value-node-setup`: adds a requirement that the referenced value must exist in the
  configuration, for both reference forms.

## Impact

- `nodes/persistent-value.js`: value resolution during setup.
- `test/persistent_value_spec.js`: two setup tests.
- `CHANGELOG.md`: #36 added to the existing `Miscellaneous Editor Fixes` entry.
