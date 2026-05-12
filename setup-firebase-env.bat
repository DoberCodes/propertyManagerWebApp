@echo off
REM Firebase Functions Environment Setup Script (Windows)
REM Run this script to configure Stripe environment variables for Firebase Functions
REM
REM Prerequisites:
REM 1. Install Firebase CLI: npm install -g firebase-tools
REM 2. Login to Firebase: firebase login
REM 3. Initialize/select project: firebase use your-project-id
REM
REM Usage:
REM setup-firebase-env.bat

echo 🔧 Setting up Firebase Functions environment variables for Stripe...
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found. Please install it first:
    echo    npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if user is logged in
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Firebase. Please run:
    echo    firebase login
    pause
    exit /b 1
)

echo 📝 Please provide your Stripe configuration:
echo.

REM Prompt for Stripe secret key
set /p STRIPE_SECRET_KEY="Enter your Stripe Secret Key (sk_test_...): "
if "%STRIPE_SECRET_KEY%"=="" (
    echo ❌ Stripe Secret Key is required
    pause
    exit /b 1
)

REM Prompt for price IDs
set /p HOME_PRICE_ID="Enter Home Plan Price ID (price_...): "
if "%HOME_PRICE_ID%"=="" (
    echo ❌ Home Price ID is required
    pause
    exit /b 1
)

set /p PROPERTY_PRICE_ID="Enter Property Plan Price ID (price_...): "
if "%PROPERTY_PRICE_ID%"=="" (
    echo ❌ Property Price ID is required
    pause
    exit /b 1
)

set /p PORTFOLIO_PRICE_ID="Enter Portfolio Plan Price ID (price_...): "
if "%PORTFOLIO_PRICE_ID%"=="" (
    echo ❌ Portfolio Price ID is required
    pause
    exit /b 1
)

echo.
echo 🚀 Setting Firebase Functions environment variables...

REM Set the environment variables
firebase functions:config:set stripe.secret_key="%STRIPE_SECRET_KEY%" stripe.home_price_id="%HOME_PRICE_ID%" stripe.property_price_id="%PROPERTY_PRICE_ID%" stripe.portfolio_price_id="%PORTFOLIO_PRICE_ID%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Firebase Functions environment variables set successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Deploy your functions: firebase deploy --only functions
    echo 2. Update your .env file with the frontend Stripe keys
    echo 3. Test the subscription flow
    echo.
    echo 🔗 Useful commands:
    echo    View config: firebase functions:config:get
    echo    Deploy functions: firebase deploy --only functions
    echo    Test functions: firebase functions:list
    echo.
) else (
    echo.
    echo ❌ Failed to set environment variables. Please check your input and try again.
)

pause