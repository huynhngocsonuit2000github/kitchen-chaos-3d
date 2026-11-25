# Workflow templates

The active PR checks live in `.github/workflows/ci.yml`. The Pages workflow here is an inert, manually dispatched candidate. It verifies the reviewed SHA belongs to main history, rebuilds the locked sources and runs Chromium checks before uploading to Pages. Its deploy job checks that the hosted entry point and its main script serve the requested build. Follow the [publication checklist](../../docs/LIVE_PREVIEW.md#m1-pages-candidate) for activation, a hosted browser smoke and rollback.
