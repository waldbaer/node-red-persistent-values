# Proposal

## Why

In the value node's edit dialog, `getContextKeyNameFromBackend` returns the `$.getJSON`
request without awaiting it, so its `try`/`catch` never sees a failed request. The failure
escapes the value select's change handler instead, and the value tip of the previously
selected value stays visible. The catch block would fail anyway, because its warning
references an undefined `id`.

## What Changes

- The context key request is awaited inside the `try`, so a failed request is caught where
  it is made.
- The warning names the configuration and the value instead of the undefined `id`, and the
  request's HTTP status, or that no response arrived, instead of `[object Object]`.
- A failed lookup returns no context key, and the dialog's existing handling for that case
  hides the value tip.
- The configuration node's edit dialog reports a failed UUID request the same way, with the
  HTTP status or that no response arrived instead of `[object Object]`.

No runtime change. Flows, already-persisted context data and the backend endpoint are
unaffected. This change does not depend on `migrate-eslint-10`, but should land before it,
because ESLint 10's `no-undef` rule reports the undefined `id`.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `editor-backend-api`: adds a requirement for how the value node's edit dialog handles a
  failed context key lookup. The endpoint itself is unchanged.

## Impact

- `nodes/persistent-value.html`: the editor script's `getContextKeyNameFromBackend`.
- `nodes/persistent-values-config.html`: the error text in the editor script's
  `generateUuidFromBackend`.
- `CHANGELOG.md`: a `Fixes` entry.
- The editor scripts are not covered by the mocha suite, so verification is a manual check
  in the Node-RED editor.
