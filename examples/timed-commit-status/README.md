# gitops-promoter-example-plugin

An example **external** UI plugin for [GitOps Promoter](https://github.com/argoproj-labs/gitops-promoter),
built and bundled entirely outside the promoter repo. It exists to prove that
promoter's runtime plugin-loading mechanism actually works end to end, by
registering an alternate design for the built-in `TimedCommitStatus` row and
overriding it at runtime — the same commit status kind promoter already ships
a first-class internal plugin for, so the two can be compared directly.

This repo has no build-time dependency on the promoter repo. It only depends
on its own `package.json` — no workspace reference, no path alias back into
`gitops-promoter`'s `ui/shared`. That's deliberate: building it in-tree would
let it reach `ui/shared` by path alias and prove nothing about whether the
external-loading mechanism works for a genuinely standalone plugin author.

## Contract types are hand-copied, not imported

`src/types.ts` and `src/util.ts` duplicate a small, narrowed slice of
`gitops-promoter`'s `ui/shared` types and utilities (`CommitStatusContext`,
`RowPlugin`, the `TimedCommitStatus` manager shape, `formatDuration`,
`parseGoDuration`) — only the fields and functions this plugin actually reads,
not the full generated CRD schema.

There is intentionally no published npm package for this contract. The ArgoCD
extension ecosystem has no precedent for one either — `argocd-example-extension`
types its host-provided props as `any`. Following that same convention, this
repo will drift from upstream `ui/shared` over time as the promoter's plugin
contract evolves. That's an accepted tradeoff, not a bug — it's exactly how
ArgoCD extension authors already work today.

## Build

```
npm install
npm run build
```

Output: `dist/plugin-timed-commit-status.js`, a single self-installing script
(webpack `library: { type: 'window' }`).

The filename matters: the promoter webserver's `/plugins.js` route serves the
concatenation of files matching a `plugin*.js` naming convention out of its
plugins directory, so `plugin-timed-commit-status.js` is ready to be dropped
in directly.

## The two hard constraints

**React is externalized, not bundled.** The host page (either the standalone
promoter dashboard or the ArgoCD UI extension surface) already has its own
React loaded on `window.React`. Bundling a second copy would create two
React instances in the same page, which breaks hooks. `webpack.config.js`
sets `externals: { react: 'React' }` so the plugin's `import React from
'react'` resolves to the host's global at runtime instead of being bundled.
`react-dom` is not externalized because it's never imported — this plugin
doesn't mount its own root; the host mounts it.

**The TypeScript build uses the classic JSX transform**
(`"jsx": "react"` in `tsconfig.json`), not the automatic runtime
(`"react-jsx"`). This matters because of a real host-version split: an
ArgoCD instance older than 3.5 ships React 16 with no `react/jsx-runtime`
global, while 3.5+ and the standalone dashboard can be on React 19. The
automatic JSX runtime compiles to an import of `react/jsx-runtime`, which
resolves to a `window.ReactJSXRuntime` global that simply doesn't exist on
older ArgoCD hosts — a mistake here doesn't fail at build time, it silently
bundles a second React runtime and produces an inscrutable "invalid hook
call" error, but only on old ArgoCD. `@types/react` is pinned to a 16.x
range as a devDependency specifically so `tsc` also rejects any accidental
use of a React 17+/18+/19-only hook (`useId`, `useSyncExternalStore`,
`useTransition`, etc.) at compile time, rather than leaving the React-16
floor as an unenforced assumption.

## Try it locally

1. `npm install && npm run build`
2. Copy `dist/plugin-timed-commit-status.js` into the directory the promoter
   webserver serves plugins from (the `--plugins-dir` flag, defaulting to
   `/tmp/plugins`).
3. The promoter webserver concatenates and serves that directory's plugin
   scripts at `/plugins.js`. Once the host page loads that script, this
   plugin's `registerCommitStatusRowPlugin` call runs and overrides the
   built-in `TimedCommitStatus` row for both the standalone dashboard and
   any ArgoCD UI extension surface pointed at the same promoter instance.

## The alternate design

The internal `TimedCommitStatus` plugin renders a name/link, "(Xm
remaining)" text, and a horizontal progress bar while pending, falling back
to a plain name/link otherwise. It only implements `rowHeader`.

This plugin renders something visibly different:

- **`rowHeader`** — a small circular countdown ring (SVG, `stroke-dashoffset`
  driven) next to the check name and a "`Xm left`" label while the check is
  pending, ticking once a second exactly like the internal plugin. Once the
  check leaves the pending phase, the ring disappears in favor of a compact
  status pill showing the environment's terminal phase.
- **`rowContent`** — expandable detail the internal plugin doesn't provide at
  all (it has no `rowContent`). For every environment the `TimedCommitStatus`
  manager is tracking, it shows the branch, phase, short commit SHA, the
  exact deployed-at timestamp, and the raw `requiredDuration` string — detail
  that's useful for a timed gate but doesn't fit in a collapsed row.

Styling is self-contained: a single `<style>` tag is injected into the host
document on first render, using plugin-prefixed class names (`gppe-*`) so it
can't collide with `components-lib`'s own stylesheet, which this plugin has
no access to and makes no assumption about.

## License

Apache License 2.0 — see `LICENSE`.
