# Releasing

Release Please keeps one reviewable release pull request up to date from Conventional Commits. Merging it updates `package.json` and `CHANGELOG.md`, creates a `v*` tag and GitHub Release, then publishes the checked tarball to npm with short-lived OIDC credentials and provenance.

## One-time setup

After `release.yml` is on `master` and before merging the first release pull request:

1. Create a GitHub environment named `npm`. Add required reviewers if desired.
2. Configure npm trusted publishing:

   ```sh
   npm trust github react-native-rating \
     --repo f0rr0/react-native-rating \
     --file release.yml \
     --env npm \
     --allow-publish
   ```

3. Backfill the missing npm 2.0.4 baseline tag so the first generated comparison link resolves:

   ```sh
   git tag v2.0.4 a07d5dc89eec88bff2fa4da65a079028c19d4976
   git push origin v2.0.4
   ```

4. Keep Actions' default token read-only and allow Actions to create pull requests. The release job grants only the three write permissions it needs: contents, issues, and pull requests.
5. Require `Check`, `React Native (minimum)`, `React Native (current)`, `Expo Web`, and `Dependency review` on `master`, and protect `v*` tags from deletion or force updates.

The first automated pull request may require a maintainer to approve its CI run because it is opened with `GITHUB_TOKEN`.

Use Conventional Commit pull request titles and squash merges so the default-branch history remains release-ready.

After the first trusted publish succeeds, set npm publishing access to **Require two-factor authentication and disallow tokens**, then revoke any legacy automation token.

## Recovery

Retry a failed publish job from its original workflow run. To retry later, run the Release workflow on `master` with its existing stable tag, such as `v3.0.0`; the publish step verifies the npm tarball before treating an existing version as successful.

After the historical baseline is in place, do not create version tags or edit release versions by hand.
