# Production Workload Identity Federation Migration

Date: 2026-08-02

Status: Gate 1 implemented; deploy cutover pending

## Objective

Replace the long-lived production Firebase service-account JSON credential with
GitHub OpenID Connect and Google Cloud Workload Identity Federation without
combining trust establishment, permission expansion, and production deploy
cutover into one event.

## Gate 1: Read-only trust canary

Created in `mypropertymanager-cda42`:

- Workload Identity pool `github-actions`.
- Provider `maintley-production`.
- Service account
  `github-production-deploy@mypropertymanager-cda42.iam.gserviceaccount.com`.

The provider accepts tokens only when both claims match:

```text
repository == DoberFamilyVentures/propertyManagerWebApp
environment == production
ref == refs/heads/main
```

The GitHub `production` environment also uses a custom deployment-branch policy
that allows only `main`.

The service account currently has only:

- Workload Identity User on itself for the repository principal set.
- Browser at the production project level.
- Firebase Hosting Viewer at the production project level.

It cannot deploy Hosting, Functions, Firestore rules, or Storage rules and
cannot impersonate either production runtime service account.

GitHub's `production` environment contains these non-secret identifiers:

```text
PROD_FIREBASE_PROJECT_ID
PROD_GOOGLE_WORKLOAD_IDENTITY_PROVIDER
PROD_GOOGLE_SERVICE_ACCOUNT
```

`.github/workflows/verify-production-deployment-identity.yml` performs a
read-only authentication and Hosting-site visibility canary after it reaches
Main. The active deploy workflow continues using
`FIREBASE_SERVICE_ACCOUNT_JSON` during this gate.

## Gate 2: Deploy permission approval

After Gate 1 passes, review and explicitly approve the exact production role
set. The intended baseline mirrors the proven Beta deploy identity, but should
be granted only immediately before the deploy cutover. Runtime Service Account
User bindings must be limited to:

```text
mypropertymanager-cda42@appspot.gserviceaccount.com
581187340388-compute@developer.gserviceaccount.com
```

Do not grant service-account key creation permissions.

## Gate 3: Workflow cutover

Replace `credentials_json` in the production deploy job with the reviewed
provider and service-account variables. Retain the JSON repository secret as a
rollback credential until a production Hosting deployment and any selected
backend targets pass.

## Gate 4: Credential retirement

After the WIF deploy path is proven:

1. Remove `FIREBASE_SERVICE_ACCOUNT_JSON` from GitHub.
2. Identify the corresponding Google service-account key.
3. Disable that key.
4. Observe the next production deployment.
5. Delete the disabled key after the rollback window closes.

Never delete an unidentified key or a key still used by local operational
scripts.

## Rollback

Before Gate 4, restore the production authentication step to
`credentials_json` and rerun only the guarded recovery workflow for the exact
release SHA. Cloud IAM and the WIF provider can remain inactive while the issue
is investigated.
