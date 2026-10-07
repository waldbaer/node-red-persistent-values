# Tasks

## 1. Prerequisites

- [x] 1.1 Verify the configuration select's change handler in `nodes/persistent-value.html` reads the configuration with `getConfigFromBackend`, and that it logs a `[Persistent Values]` error naming the ID and returns `undefined` when the backend doesn't know the configuration

## 2. Configuration missing in the value node's edit dialog

- [x] 2.1 In the configuration select's change handler, handle a configuration that `getConfigFromBackend` doesn't resolve: empty and disable the value list, hide the value tip and the deep-clone option, and return. Don't fire the value list's change event, because with an empty selection it clears the stored reference. Verify `npm run lint` stays clean
- [x] 2.2 In a running Node-RED, import only a value node whose `valuesConfig` names a configuration that doesn't exist, and open its edit dialog. Verify there is no uncaught error, the value list is empty and disabled and the tip is hidden. If the configuration field still carries the missing ID, verify the console shows the `[Persistent Values]` error naming it. Repeat with a configuration imported together with the value node but not deployed, and verify the error names that configuration's ID
- [x] 2.3 Close those dialogs with Done and export the value nodes. Verify `valueId` and `value` are unchanged
- [x] 2.4 Add `#37` to the `Miscellaneous Editor Fixes` entry under `[Unreleased]` → `Fixes` in `CHANGELOG.md`, and verify it is there
