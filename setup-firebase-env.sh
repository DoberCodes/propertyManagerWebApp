#!/bin/bash

# Firebase Functions Environment Setup Script
# Run this script from the project root to configure Stripe params for Firebase Functions.
#
# Prerequisites:
# 1. Install Firebase CLI: npm install -g firebase-tools
# 2. Login to Firebase: firebase login
# 3. Initialize/select project: firebase use your-project-id
#
# Usage:
# chmod +x setup-firebase-env.sh
# ./setup-firebase-env.sh

echo "Setting up Firebase Functions Stripe configuration..."

if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

if ! firebase projects:list &> /dev/null; then
    echo "Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo "Please provide your Stripe configuration:"
echo ""

read -p "Enter your Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "Stripe Secret Key is required"
    exit 1
fi

read -p "Enter Homeowner+ Monthly Price ID (price_...): " HOMEOWNER_PLUS_MONTHLY_PRICE_ID
if [ -z "$HOMEOWNER_PLUS_MONTHLY_PRICE_ID" ]; then
    echo "Homeowner+ Monthly Price ID is required"
    exit 1
fi

read -p "Enter Homeowner+ Annual Price ID (price_...): " HOMEOWNER_PLUS_ANNUAL_PRICE_ID
if [ -z "$HOMEOWNER_PLUS_ANNUAL_PRICE_ID" ]; then
    echo "Homeowner+ Annual Price ID is required"
    exit 1
fi

read -p "Enter Property Monthly Price ID (price_...): " PROPERTY_MONTHLY_PRICE_ID
if [ -z "$PROPERTY_MONTHLY_PRICE_ID" ]; then
    echo "Property Monthly Price ID is required"
    exit 1
fi

read -p "Enter Property Annual Price ID (price_...): " PROPERTY_ANNUAL_PRICE_ID
if [ -z "$PROPERTY_ANNUAL_PRICE_ID" ]; then
    echo "Property Annual Price ID is required"
    exit 1
fi

read -p "Enter Portfolio Monthly Price ID (price_...): " PORTFOLIO_MONTHLY_PRICE_ID
if [ -z "$PORTFOLIO_MONTHLY_PRICE_ID" ]; then
    echo "Portfolio Monthly Price ID is required"
    exit 1
fi

read -p "Enter Portfolio Annual Price ID (price_...): " PORTFOLIO_ANNUAL_PRICE_ID
if [ -z "$PORTFOLIO_ANNUAL_PRICE_ID" ]; then
    echo "Portfolio Annual Price ID is required"
    exit 1
fi

echo ""
echo "Writing Firebase Functions params..."

mkdir -p functions
cat > functions/.env <<EOF
STRIPE_HOMEOWNER_PLUS_PRICE_ID=$HOMEOWNER_PLUS_MONTHLY_PRICE_ID
STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID=$HOMEOWNER_PLUS_MONTHLY_PRICE_ID
STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID=$HOMEOWNER_PLUS_ANNUAL_PRICE_ID
STRIPE_PROPERTY_PRICE_ID=$PROPERTY_MONTHLY_PRICE_ID
STRIPE_PROPERTY_MONTHLY_PRICE_ID=$PROPERTY_MONTHLY_PRICE_ID
STRIPE_PROPERTY_ANNUAL_PRICE_ID=$PROPERTY_ANNUAL_PRICE_ID
STRIPE_PORTFOLIO_PRICE_ID=$PORTFOLIO_MONTHLY_PRICE_ID
STRIPE_PORTFOLIO_MONTHLY_PRICE_ID=$PORTFOLIO_MONTHLY_PRICE_ID
STRIPE_PORTFOLIO_ANNUAL_PRICE_ID=$PORTFOLIO_ANNUAL_PRICE_ID
EOF

chmod 600 functions/.env

echo "Setting STRIPE_SECRET_KEY in Secret Manager..."
printf "%s" "$STRIPE_SECRET_KEY" | firebase functions:secrets:set STRIPE_SECRET_KEY --data-file -

if [ $? -eq 0 ]; then
    echo ""
    echo "Firebase Functions params and Stripe secret set successfully."
    echo ""
    echo "Next steps:"
    echo "1. Deploy your functions: firebase deploy --only functions"
    echo "2. Update your root .env file with the frontend Stripe keys"
    echo "3. Test the subscription flow"
    echo ""
    echo "Useful commands:"
    echo "   Review params: cat functions/.env"
    echo "   Deploy functions: firebase deploy --only functions"
    echo "   Test functions: firebase functions:list"
else
    echo ""
    echo "Failed to set Firebase Functions params or secrets. Please check your input and try again."
    exit 1
fi
