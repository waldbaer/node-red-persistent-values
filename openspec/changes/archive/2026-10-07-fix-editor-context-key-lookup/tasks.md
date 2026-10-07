# Tasks

## 1. Context key lookup in the value node's edit dialog

- [x] 1.1 In `getContextKeyNameFromBackend` (`nodes/persistent-value.html`), await `$.getJSON` inside the `try` and replace the undefined `id` in the warning with the configuration and value names, and the stringified request error with its HTTP status or `no response`. Verify `npm run lint` stays clean
- [x] 1.2 In a running Node-RED, block requests to `persistentvalues/util/getcontextkey` in the browser's developer tools, open a value node's edit dialog and select a value. Verify the console shows a `[Persistent Values]` warning naming the configuration and the value and ending in `no response (error)`, the value tip is hidden, and no uncaught promise rejection is reported
- [x] 1.3 Unblock the request and select a value again. Verify the value tip shows the context key together with datatype, default, scope, storage and description
- [x] 1.4 In `CHANGELOG.md`, under `[Unreleased]` → `Fixes`, add this fix's pull request (#35) to the existing `Miscellaneous Editor Fixes` entry next to #34, and verify it reads `Miscellaneous Editor Fixes (#34, #35)`
- [x] 1.5 In `generateUuidFromBackend` (`nodes/persistent-values-config.html`), replace the stringified request error in the error message with its HTTP status or `no response`. Verify `npm run lint` stays clean, then block requests to `persistentvalues/config/generate_uuid`, add a value in the configuration node's edit dialog and verify the console shows a `[Persistent Values]` error ending in `no response (error)`
