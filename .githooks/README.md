# Git hooks

`core.hooksPath` is per-clone local config and isn't set by cloning the repo — run this once after cloning:

```
git config core.hooksPath .githooks
```

## `pre-push`

Blocks `git push` unless a single-use authorization marker exists at `.git/PUSH_AUTHORIZED` containing one of: `push`, `sube`, `go push`, `dale push`, `adelante con el push`, `autorizado push`. The marker is deleted on use.

This exists so an AI assistant working in this repo can never push without the owner literally typing a go-word first — the assistant must stop, show the pending diff/commits, and only write the marker after that literal confirmation. Do not bypass with `git push --no-verify` unless the owner explicitly asks for it.
