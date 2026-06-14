@echo off
REM Firebase Functions Environment Setup Script (Windows)
REM Run this script from the project root to configure Stripe params for Firebase Functions.
REM
REM Prerequisites:
REM 1. Install Firebase CLI: npm install -g firebase-tools
REM 2. Login to Firebase: firebase login
REM 3. Initialize/select project: firebase use your-project-id
REM
REM Usage:
REM setup-firebase-env.bat

echo Setting up Firebase Functions Stripe configuration...
echo.

firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Firebase CLI not found. Please install it first:
    echo    npm install -g firebase-tools
    pause
    exit /b 1
)

firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo Not logged in to Firebase. Please run:
    echo    firebase login
    pause
    exit /b 1
)

echo Please provide your Stripe configuration:
echo.

set /p STRIPE_SECRET_KEY="Enter your Stripe Secret Key (sk_test_...): "
if "%STRIPE_SECRET_KEY%"=="" (
    echo Stripe Secret Key is required
    pause
    exit /b 1
)

set /p HOMEOWNER_PLUS_MONTHLY_PRICE_ID="Enter Homeowner+ Monthly Price ID (price_...): "
if "%HOMEOWNER_PLUS_MONTHLY_PRICE_ID%"=="" (
    echo Homeowner+ Monthly Price ID is required
    pause
    exit /b 1
)

set /p HOMEOWNER_PLUS_ANNUAL_PRICE_ID="Enter Homeowner+ Annual Price ID (price_...): "
if "%HOMEOWNER_PLUS_ANNUAL_PRICE_ID%"=="" (
    echo Homeowner+ Annual Price ID is required
    pause
    exit /b 1
)

set /p PROPERTY_MONTHLY_PRICE_ID="Enter Property Monthly Price ID (price_...): "
if "%PROPERTY_MONTHLY_PRICE_ID%"=="" (
    echo Property Monthly Price ID is required
    pause
    exit /b 1
)

set /p PROPERTY_ANNUAL_PRICE_ID="Enter Property Annual Price ID (price_...): "
if "%PROPERTY_ANNUAL_PRICE_ID%"=="" (
    echo Property Annual Price ID is required
    pause
    exit /b 1
)

set /p PORTFOLIO_MONTHLY_PRICE_ID="Enter Portfolio Monthly Price ID (price_...): "
if "%PORTFOLIO_MONTHLY_PRICE_ID%"=="" (
    echo Portfolio Monthly Price ID is required
    pause
    exit /b 1
)

set /p PORTFOLIO_ANNUAL_PRICE_ID="Enter Portfolio Annual Price ID (price_...): "
if "%PORTFOLIO_ANNUAL_PRICE_ID%"=="" (
    echo Portfolio Annual Price ID is required
    pause
    exit /b 1
)

echo.
echo Writing Firebase Functions params...

if not exist functions mkdir functions
(
    echo STRIPE_HOMEOWNER_PLUS_PRICE_ID=%HOMEOWNER_PLUS_MONTHLY_PRICE_ID%
    echo STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID=%HOMEOWNER_PLUS_MONTHLY_PRICE_ID%
    echo STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID=%HOMEOWNER_PLUS_ANNUAL_PRICE_ID%
    echo STRIPE_PROPERTY_PRICE_ID=%PROPERTY_MONTHLY_PRICE_ID%
    echo STRIPE_PROPERTY_MONTHLY_PRICE_ID=%PROPERTY_MONTHLY_PRICE_ID%
    echo STRIPE_PROPERTY_ANNUAL_PRICE_ID=%PROPERTY_ANNUAL_PRICE_ID%
    echo STRIPE_PORTFOLIO_PRICE_ID=%PORTFOLIO_MONTHLY_PRICE_ID%
    echo STRIPE_PORTFOLIO_MONTHLY_PRICE_ID=%PORTFOLIO_MONTHLY_PRICE_ID%
    echo STRIPE_PORTFOLIO_ANNUAL_PRICE_ID=%PORTFOLIO_ANNUAL_PRICE_ID%
) > functions\.env

echo Setting STRIPE_SECRET_KEY in Secret Manager...
echo(%STRIPE_SECRET_KEY%| firebase functions:secrets:set STRIPE_SECRET_KEY --data-file -

if %errorlevel% equ 0 (
    echo.
    echo Firebase Functions params and Stripe secret set successfully.
    echo.
    echo Next steps:
    echo 1. Deploy your functions: firebase deploy --only functions
    echo 2. Update your root .env file with the frontend Stripe keys
    echo 3. Test the subscription flow
    echo.
    echo Useful commands:
    echo    Review params: type functions\.env
    echo    Deploy functions: firebase deploy --only functions
    echo    Test functions: firebase functions:list
    echo.
) else (
    echo.
    echo Failed to set Firebase Functions params or secrets. Please check your input and try again.
)

pause
