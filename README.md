# gitops-promoter-ui-plugins

Example **external** UI plugins for [GitOps Promoter](https://github.com/argoproj-labs/gitops-promoter),
each built and bundled entirely outside the promoter repo and loaded into it at
runtime — proving out the promoter's external plugin-loading mechanism, the
way `argocd-example-extension` does for ArgoCD UI extensions.

For the plugin authoring contract, registration, and all supported loading
paths (build-time dashboard embed, runtime dashboard `--plugins-dir`, and
build-time ArgoCD extension concatenation), see the promoter repo's own docs:
[`docs/contributing/developing-ui-plugins.md`](https://github.com/argoproj-labs/gitops-promoter/blob/main/docs/contributing/developing-ui-plugins.md)
and
[`docs/contributing/developing-the-argocd-extension.md`](https://github.com/argoproj-labs/gitops-promoter/blob/main/docs/contributing/developing-the-argocd-extension.md).

## Examples

- [`examples/timed-commit-status`](examples/timed-commit-status) — an
  alternate design of the built-in `TimedCommitStatus` row, registered at
  runtime to override the first-class internal plugin of the same kind.

Each example is a standalone npm project with its own `package.json`, build,
and README — there is no shared workspace root.
