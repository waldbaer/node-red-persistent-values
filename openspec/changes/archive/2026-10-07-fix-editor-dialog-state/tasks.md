# Tasks

## 1. Local configuration in the value node's edit dialog

- [x] 1.1 Declare `backendConfig` with `const` at its assignment in the configuration select's change handler (`nodes/persistent-value.html`). Verify `npm run lint` stays clean and `grep -n 'backendConfig' nodes/persistent-value.html` shows no use outside that handler
- [x] 1.2 In a running Node-RED, open a value node's edit dialog and switch between two configurations. Verify the value list is re-populated for each, the stored value is selected when the dialog opens, and `window.backendConfig` is `undefined` in the browser console
- [x] 1.3 Add the entry `Miscellaneous Editor Fixes` under `[Unreleased]` → `Fixes` in `CHANGELOG.md` for the fixes of this change, and verify it is there

## 2. Dialog state kept out of the node

- [x] 2.1 In the change handlers of the value select and the configuration select (`nodes/persistent-value.html`), write the selected value ID, value name and configuration name only to `node-input-valueId`, `node-input-value` and `node-input-valuesConfigName`, and take the names for the context key lookup from the dialog instead of from `node`. Verify `npm run lint` stays clean and `grep -nE 'node\.(valueId|value|valuesConfigName) *=' nodes/persistent-value.html` finds nothing
- [x] 2.2 In a running Node-RED, open the dialog of a value node with a stored value, switch to a configuration without that value and back. Verify no value is selected in between and the stored value is selected again afterwards
- [x] 2.3 Switch to a configuration without the stored value and close with Done. Verify the node is marked invalid and its export has empty `valueId` and `value`
- [x] 2.4 On a deployed flow, select another value of the same configuration and close with Done. Verify the Deploy button is enabled and Edit → Undo restores the previous value
- [x] 2.5 Change the configuration and the value and close with Cancel. Verify the node's export still has its original `valuesConfig`, `valuesConfigName`, `valueId` and `value`, and that its label is unchanged
- [x] 2.6 Verify the `CHANGELOG.md` entry from 1.3 also covers the fixes of this section, which the commit message describes in detail

## 3. Integration

- [x] 3.1 Run `openspec validate fix-editor-dialog-state --strict` and verify the change is valid
