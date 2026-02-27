# My Property Manager Web App

> **Proprietary Notice:**
> This codebase is the exclusive property of Dober Family Ventures, LLC. Unauthorized copying, modification, distribution, or use is strictly prohibited. See LICENSE for details.

## Project Hygiene & Onboarding

- **Environment Variables:**
	- Copy `.env.example` to `.env.local` and fill in your secrets and config values. Never commit real secrets to git.
	- The project’s `.gitignore` ensures all `.env*` files (except `.env.example`) are ignored for security.

- **Release Notes:**
	- See `RELEASE_NOTES.txt` for a summary of changes and updates, generated automatically from commit history.

- **Scripts Folder:**
	- The `scripts/` directory contains tracked utilities for database seeding, migrations, and automation. Only essential scripts are tracked; temp or sensitive scripts are ignored.

- **Stripe CLI & Webhooks:**
	- For local Stripe webhook development, use the automated script: `npm run stripe:webhook:auto` (from the `functions` directory). This updates your webhook secret in `.env.local` and starts the listener.
	- See `.env.example` for required Stripe environment variables.

- **Security:**
	- Sensitive files (service accounts, secrets, APKs, etc.) are ignored by git. Never commit credentials or production keys.

- **Code Style:**
	- The project uses Prettier and ESLint for consistent code formatting and linting. Run `yarn lint` and `yarn format` (if available) before committing.

- **Collaboration:**
	- Please follow the established code style and use the provided scripts for setup and deployment. For questions, see in-code comments or contact the maintainer.


This is a full-featured property management web application built with React, Redux Toolkit, Firebase, and Capacitor. It supports both web and native (Android) deployments, push notifications, team management, and real-time task tracking.

## Key Features

- User authentication and team management
- Task assignment, tracking, and completion
- Push notifications for native app users (requires Firebase Cloud Functions and Blaze plan)
- Efficiency dashboard with live pie chart of task statuses (Completed, In Progress, Overdue)
- Property and unit management
- Modern, responsive UI

## Getting Started

### Prerequisites

- Node.js and Yarn
- Firebase project (with Firestore and Authentication enabled)
- (For native features) Android Studio and Capacitor CLI

### Installation

1. Clone the repository
2. Run `yarn install` to install dependencies
3. Copy your Firebase service account key to `serviceAccountKey.json`
4. Configure your Firebase project in `src/config/firebase.ts`

### Running the App

- `yarn start` — Start the web app at [http://localhost:3000](http://localhost:3000)
- `yarn build` — Build for production
- `yarn test` — Run tests

### Native App (Android)

- `yarn build && npx cap sync android` — Sync web build to Android
- `npx cap open android` — Open in Android Studio
- Build and run the app on your device/emulator

### Push Notifications

- Native push notifications require the Blaze plan and Firebase Cloud Functions
- See `functions/sendPushOnNotificationCreate.ts` for the Cloud Function
- Push tokens are saved to Firestore and used for notification delivery

### Efficiency Chart

- The dashboard includes a live pie chart (powered by [recharts](https://recharts.org/)) showing the breakdown of tasks by status: Completed, In Progress, and Overdue

## Scripts

- `yarn start` — Start development server
- `yarn build` — Build for production
- `yarn test` — Run tests
- `yarn cap:sync` — Build and sync to Android
- `yarn cap:open` — Open Android Studio
- `yarn build:apk` — Build and sync APK
- `yarn build:signed` — Build signed APK (see `build-signed-apk.sh`)

## Database Maintenance Scripts

The `scripts/` directory contains utilities for database management and migrations:

### Orphaned Data Cleanup

```bash
node scripts/migrateRemoveOrphanedData.cjs
```

**Purpose**: Removes all data not connected to current Firebase Auth users (orphaned data from deleted accounts).

**What it cleans**: User profiles, notifications, contractors, property groups, team data, favorites, tasks, and property-related data.

**When to run**:

- After implementing account deletion features
- Periodically for database maintenance (monthly/quarterly)
- Before major deployments
- When adding new collections

**Safety**: Idempotent and safe to run repeatedly. Now includes the `users` collection that was previously missed!

### Other Migration Scripts

- `migrateAddSubscriptions.cjs` — Add subscription data to existing users
- `migrateAddUserToMyTeam.cjs` — Add user-to-team relationships
- `seedFirestore.cjs` — Seed database with sample data
- `initFirestore.cjs` — Initialize collection structure

## Notes

- Push notifications and APK download are only available on the native app
- Update notifications and APK download logic are in `UpdateNotification.tsx`
- For custom branding, see `src/Assets/images/`

## Beta Testing Environment (Separate Firebase)

This repository supports an isolated beta environment driven by the `beta` branch.

- `main` branch -> production Firebase project
- `beta` branch -> testing Firebase project

### 1) Configure Firebase project aliases

Update `.firebaserc`:

- `prod`: production Firebase project id
- `beta`: testing Firebase project id

### 2) Add GitHub repository secrets

Add these secrets for branch-aware web builds:

- `PROD_REACT_APP_FIREBASE_API_KEY`
- `PROD_REACT_APP_FIREBASE_AUTH_DOMAIN`
- `PROD_REACT_APP_FIREBASE_PROJECT_ID`
- `PROD_REACT_APP_FIREBASE_STORAGE_BUCKET`
- `PROD_REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `PROD_REACT_APP_FIREBASE_APP_ID`
- `PROD_REACT_APP_STRIPE_PUBLIC_KEY`
- `BETA_REACT_APP_FIREBASE_API_KEY`
- `BETA_REACT_APP_FIREBASE_AUTH_DOMAIN`
- `BETA_REACT_APP_FIREBASE_PROJECT_ID`
- `BETA_REACT_APP_FIREBASE_STORAGE_BUCKET`
- `BETA_REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `BETA_REACT_APP_FIREBASE_APP_ID`
- `BETA_REACT_APP_STRIPE_PUBLIC_KEY`

Add these secrets for Firebase deploy workflow:

- `PROD_FIREBASE_PROJECT_ID`
- `BETA_FIREBASE_PROJECT_ID`
- `FIREBASE_TOKEN`

### 3) Branch behavior

- Build workflow automatically injects `BETA_*` secrets when targeting `beta`.
- Firebase deploy workflow automatically deploys to beta on `beta` pushes and prod on `main` pushes.
- You can also trigger deployment manually with `workflow_dispatch` and choose target (`beta` or `prod`).

---

For more details, see the in-app documentation and comments throughout the codebase.

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `yarn build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
