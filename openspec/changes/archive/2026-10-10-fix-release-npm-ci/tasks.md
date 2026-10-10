# Tasks

## 1. Release workflow

- [x] 1.1 In `.github/workflows/release.yml`, replace the `npm ci` step with `npm install`, and verify `grep -rn 'npm ci' .github/workflows` finds nothing, the file still parses as YAML, and `git diff` shows only that line

## 2. Verification

- [x] 2.1 On a fresh clone of the branch (no `package-lock.json`, no `node_modules`), run the workflow's steps up to the publish with Node.js 22: `npm install`, `npm run build --if-present` and `npm test`. Verify each exits 0, and that `npm pack --dry-run` lists the same 16 files as before and no `package-lock.json`
