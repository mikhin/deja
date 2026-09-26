# deja — development guidelines

A CLI that opens the past Claude Code session you talked about.

## Architecture

- Logic in `/services`, one exported function per file; `/formatters` render, `/cli` runs the process
- `/cli` and `src/main.ts` are excluded from coverage: they only print, `process.exit` and `spawnSync`
- Functional style, no classes
- Imports go through `#src/*.ts` (Node subpath imports, mapped to `dist/*.js`): Node refuses to
  strip types under `node_modules`, so the binary is `dist/main.js`, built by `pnpm build` on
  `prepare`; typecheck and tests read `src` through the alias, so a code change needs `pnpm build`
  before the linked `deja` sees it
- No re-export barrels; import from the file that defines the thing

## TypeScript

- Ban `any`; transcript JSON arrives as `unknown` and is narrowed by guards
- Max strictness, explicit return types on exported functions
- `type` over `interface`

## Comments

None. `local/no-comments` fails the lint. What a comment would have said goes into a name,
a test, or the commit message.

## Testing

- Vitest, 100% coverage of `src/**` outside `/cli`
- An unreachable branch is deleted, not covered: that is how `if (terms.length === 1) break` and
  the defensive `?? ""` guards against `noUncheckedIndexedAccess` went away
- Test names describe behaviour by inputs and outcome

## Rounding

Services return exact shares (`summarizePicks`); the formatter turns them into percent
(`formatPercent`).

## Domain

- **transcript** — `~/.claude/projects/<project>/<sessionId>.jsonl`, appended to while a session runs
- Only what the user typed is indexed: hook, skill and `<command-name>` text is dropped, while the
  arguments of a slash command are kept
- **trigram** matches substrings, so the query must be shorter than the text: `result` finds
  "results", `results` does not find "result" — hence shortening letter by letter
- Shorten the word that has other forms in the corpus (its document count grows), never the longest
  one: otherwise `watchdog` becomes `watch` and the results turn to noise
- **picks.jsonl** is the only evidence about search quality; an `auto` outcome counts as a success
  until `deja --wrong` says otherwise
