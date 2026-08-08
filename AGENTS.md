<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git push requires explicit owner authorization — enforced by a hook, not a promise

`git push` is technically blocked by `.githooks/pre-push` (see `.githooks/README.md`) unless a single-use marker exists at `.git/PUSH_AUTHORIZED` containing a literal go-word (`push`, `sube`, `go push`, `dale push`, `adelante con el push`, `autorizado push`). The marker is deleted on use, so one authorization never covers a later, different push.

After cloning, run once: `git config core.hooksPath .githooks`.

Any assistant working in this repo must: stop before pushing, show the pending diff/commits, and only write the marker after the owner literally types one of those go-words in response to that specific request. Merging a PR is a separate action needing its own separate authorization — do not treat a push GO as a merge GO or vice versa. Never bypass with `git push --no-verify` unless the owner explicitly asks for it. Never push directly to `main` — always branch, PR, and let the owner authorize the merge too.
