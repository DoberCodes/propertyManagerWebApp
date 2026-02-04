#!/bin/bash

# Firebase Functions Environment Setup Script
# Run this script to configure Stripe environment variables for Firebase Functions
#
# Prerequisites:
# 1. Install Firebase CLI: npm install -g firebase-tools
# 2. Login to Firebase: firebase login
# 3. Initialize/select project: firebase use your-project-id
#
# Usage:
# chmod +x setup-firebase-env.sh
# ./setup-firebase-env.sh

echo "🔧 Setting up Firebase Functions environment variables for Stripe..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo "📝 Please provide your Stripe configuration:"
echo ""

# Prompt for Stripe secret key
read -p "Enter your Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Stripe Secret Key is required"
    exit 1
fi

# Prompt for price IDs
read -p "Enter Homeowner Plan Price ID (price_...): " HOMEOWNER_PRICE_ID
if [ -z "$HOMEOWNER_PRICE_ID" ]; then
    echo "❌ Homeowner Price ID is required"
    exit 1
fi

read -p "Enter Basic Plan Price ID (price_...): " BASIC_PRICE_ID
if [ -z "$BASIC_PRICE_ID" ]; then
    echo "❌ Basic Price ID is required"
    exit 1
fi

read -p "Enter Professional Plan Price ID (price_...): " PROFESSIONAL_PRICE_ID
if [ -z "$PROFESSIONAL_PRICE_ID" ]; then
    echo "❌ Professional Price ID is required"
    exit 1
fi

echo ""
echo "🚀 Setting Firebase Functions environment variables..."

# Set the environment variables
firebase functions:config:set \
    stripe.secret_key="$STRIPE_SECRET_KEY" \
    stripe.homeowner_price_id="$HOMEOWNER_PRICE_ID" \
    stripe.basic_price_id="$BASIC_PRICE_ID" \
    stripe.professional_price_id="$PROFESSIONAL_PRICE_ID"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firebase Functions environment variables set successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Deploy your functions: firebase deploy --only functions"
    echo "2. Update your .env file with the frontend Stripe keys"
    echo "3. Test the subscription flow"
    echo ""
    echo "🔗 Useful commands:"
    echo "   View config: firebase functions:config:get"
    echo "   Deploy functions: firebase deploy --only functions"
    echo "   Test functions: firebase functions:list"
else
    echo ""
    echo "❌ Failed to set environment variables. Please check your input and try again."
    exit 1
fi