
# My Property Manager Web App

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

## Project Structure

- `src/` — Main source code
- `src/Components/` — React components (Dashboard, Tasks, Notifications, etc.)
- `src/Redux/` — Redux Toolkit slices and API
- `src/services/` — Service modules (auth, push notifications)
- `functions/` — Firebase Cloud Functions (for push notifications)
- `scripts/` — Utility scripts (migrations, seeding, etc.)

## Notes

- Push notifications and APK download are only available on the native app
- Update notifications and APK download logic are in `UpdateNotification.tsx`
- For custom branding, see `src/Assets/images/`

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
