# GitHub Pages preview

The Producer has authorized automatic preview deployment from `main`. The live game remains at [Kitchen Chaos 3D](https://huynhngocsonuit2000github.github.io/kitchen-chaos-3d/) with the Vite base path `/kitchen-chaos-3d/`. Keep **Settings → Pages → Build and deployment → Source** set to **GitHub Actions**. The workflow uses the existing `github-pages` environment. Any configured environment protections still apply.

## Automatic deployment

A push to `main` triggers the [Pages preview workflow](../.github/workflows/pages.yml). This includes merges and direct pushes, so use the repository's PR process for changes to `main`. PR checks run separately and have no Pages deploy job.

The workflow uses locked dependencies and runs type checking, lint, unit tests, a production build and Chromium browser tests on the triggering revision. It uploads the exact tested `dist` for deployment only after those steps pass. Failed checks leave the last successful Pages deployment intact. A single Pages workflow runs at a time for `main`, and the deploy job verifies that its checked revision is still the tip of `main` immediately before publishing. A superseded run skips publication. The workflow does not cancel an active deployment to start a newer one.

The game footer displays the package version and full deployed commit SHA. The workflow checks that the hosted entry point resolves to JavaScript carrying the expected SHA. Use the Actions run and the game footer to verify the revision after deployment. For a manual browser smoke, open the site in Chromium, check console and asset loading, start a shift, deliver a Classic burger, pause and restart. Record the run, revision, browser and result.

## Redeployment and recovery

- In **Actions → Authorized Pages preview → Run workflow**, select `main` and run it without inputs. The current revision goes through the same checks, serialization and freshness guard.
- To recover from a broken live preview, open a revert or corrective PR that restores the known-good behavior. Once it is merged, the new `main` revision is checked and deployed automatically. Verify the hosted SHA and repeat the browser smoke. Check save compatibility before a revert and preserve existing player saves.
- If deployment fails after checks pass, inspect the GitHub Pages deployment and hosted smoke results before retrying. A hosted smoke failure can occur after GitHub Pages has already accepted the deployment.

## Approval boundaries

Automatic publication applies to the preview from `main`. Milestone quality gates, Producer release approval, rights review and separate authorization for repository visibility or hosting changes still apply. Use gameplay feedback, screenshots and QA evidence in review. Passing CI or a successful deploy does not satisfy a human approval gate.
