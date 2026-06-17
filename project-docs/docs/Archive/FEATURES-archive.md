# My Property Manager Web App — Feature Guide

Welcome to the My Property Manager Web App! This document provides a comprehensive overview of all major features, how to use them, and troubleshooting tips. If you encounter issues, refer to this guide for help.

---

## Table of Contents

- [User Authentication](#user-authentication)
- [Team Management](#team-management)
- [Task Management](#task-management)
- [Efficiency Dashboard](#efficiency-dashboard)
- [Push Notifications](#push-notifications)
- [Update Notifications & APK Download](#update-notifications--apk-download)
- [Property & Unit Management](#property--unit-management)
- [Native App Features](#native-app-features)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## User Authentication

- Sign up, log in, and log out securely using Firebase Authentication.
- Password reset and email verification supported.
- Troubleshooting:
  - If you can't log in, check your email and password.
  - For password reset, use the "Forgot Password" link.

## Team Management

- Create and manage teams for each property or organization.
- Assign roles (Admin, Manager, Member, Tenant, etc.) to users.
- Invite new members by email.
- Remove or update team members as needed.
- Troubleshooting:
  - If invites aren't received, check spam or verify the email address.

## Task Management

- Create, assign, and track tasks for properties, units, or suites.
- Task statuses: Pending, In Progress, Awaiting Approval, Completed, Rejected.
- Assign tasks to yourself or team members.
- Mark tasks as complete, add notes, and upload completion files.
- Overdue tasks are highlighted in the dashboard.
- Troubleshooting:
  - If tasks don't update, refresh the page or check your connection.
  - Only Admins/Managers can assign or approve tasks.

## Efficiency Dashboard

- Visual pie chart shows breakdown of tasks by status (Completed, In Progress, Overdue).
- View team members and their roles.
- Real-time updates as tasks are created or completed.
- Troubleshooting:
  - If the chart doesn't load, ensure you have tasks assigned.

<!--
## Push Notifications
- Native app users receive push notifications for new tasks and updates (requires Blaze plan and Cloud Functions).
- Push token is saved to your user profile on the device.
- Troubleshooting:
  - Ensure notifications are enabled in device settings.
  - If not receiving notifications, check your app version and network.
-->

## Update Notifications & APK Download

- When a new version is available, a notification appears in the app.
- Download the latest APK directly from the app (Android only).
- Step-by-step help for enabling "Install unknown apps" is provided.
- Troubleshooting:
  - If APK download fails, check your browser permissions or try again.

## Property & Unit Management

- Add, edit, and view properties, units, and suites.
- Assign team members to specific properties.
- View property details, history, and associated tasks.
- Troubleshooting:
  - If properties don't appear, ensure you have the correct permissions.

## Native App Features

- All web features plus:
  - Push notifications
  - APK download and update notifications
  - Optimized for mobile devices
- Install via APK or Google Play (if available).

## Troubleshooting & FAQ

- **App not loading?**
  - Check your internet connection and try refreshing.
- **Can't log in?**
  - Use the password reset feature or contact your admin.
- **Push notifications not working?**
  - Make sure you are on the native app and notifications are enabled.
- **Task updates not saving?**
  - Check your connection and try again. If the issue persists, contact support.
- **Need more help?**
  - Contact your property manager or support team for further assistance.

---

For more details, see the README.md or in-app help sections. This document is updated regularly with new features and troubleshooting tips.
