# Paywall & Subscription System

## Overview

The Property Manager Web App now includes a comprehensive paywall system with a 14-day free trial and tiered subscription plans.

## Features

### Free Trial (14 days)

- New users automatically get a 14-day free trial
- No credit card required during signup
- Full access to basic features
- Trial countdown banner on dashboard
- Warning when trial is expiring

### Subscription Plans

1. **Free Trial** - $0/month
   - Up to 3 properties
   - Basic maintenance tracking

2. **Basic** - $9.99/month
   - Up to 10 properties
   - Maintenance tracking
   - Team collaboration
   - Mobile app access

3. **Professional** - $24.99/month
   - Unlimited properties
   - Maintenance tracking
   - Team collaboration
   - Mobile app access
   - Custom reporting
   - Priority support

4. **Enterprise** - Custom pricing
   - Everything in Professional
   - API access
   - Custom integrations
   - Dedicated support
   - Advanced analytics

## Architecture

### Key Files

- `src/constants/subscriptions.ts` - Subscription plans and constants
- `src/utils/subscriptionUtils.ts` - Subscription logic and helpers
- `src/pages/PaywallPage/` - Pricing and plan selection UI
- `src/components/ProtectedByPaywall/` - Route protection component
- `src/components/TrialWarningBanner/` - Trial expiration warning
- `src/services/authService.ts` - User creation with trial subscription

### Data Structure

User document now includes subscription data:

```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  subscription: {
    status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';
    plan: 'free' | 'basic' | 'professional' | 'enterprise';
    currentPeriodStart: number; // Unix timestamp
    currentPeriodEnd: number; // Unix timestamp
    trialEndsAt?: number; // Unix timestamp
    canceledAt?: number; // Unix timestamp
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}
```

## Usage

### Integrating with Routes

Protect routes that require active subscription:

```tsx
import ProtectedByPaywall from './components/ProtectedByPaywall/ProtectedByPaywall';

<ProtectedByPaywall subscription={user.subscription}>
	<YourProtectedComponent />
</ProtectedByPaywall>;
```

### Displaying Trial Warning

In your dashboard:

```tsx
import TrialWarningBanner from './components/TrialWarningBanner/TrialWarningBanner';
import { getTrialDaysRemaining } from './utils/subscriptionUtils';

const daysRemaining = getTrialDaysRemaining(subscription);

<TrialWarningBanner
	daysRemaining={daysRemaining}
	onUpgradeClick={() => navigate('/paywall')}
/>;
```

### Checking Subscription Status

```tsx
import {
	isTrialActive,
	isSubscriptionActive,
	getTrialDaysRemaining,
	getSubscriptionDisplayText,
} from './utils/subscriptionUtils';

// Check if trial is still active
if (isTrialActive(subscription)) {
	console.log('User is in trial period');
}

// Check if subscription is active (trial or paid)
if (isSubscriptionActive(subscription)) {
	console.log('User has active subscription');
}

// Get days remaining
const days = getTrialDaysRemaining(subscription);
console.log(`${days} days left in trial`);

// Get display text
const text = getSubscriptionDisplayText(subscription);
console.log(text); // e.g., "Free Trial - 7 days remaining"
```

## Stripe Integration (Future)

To integrate with Stripe for payments:

1. Install Stripe packages:

   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js stripe
   ```

2. Create payment processing service:

   ```tsx
   // src/services/paymentService.ts
   import { loadStripe } from '@stripe/stripe-js';

   const stripe = await loadStripe(process.env.REACT_APP_STRIPE_KEY);

   export const createCheckoutSession = async (
   	planId: string,
   	userId: string,
   ) => {
   	// Call backend to create checkout session
   	// Redirect to Stripe checkout
   };
   ```

3. Update PaywallPage to handle Stripe:

   ```tsx
   const handlePlanSelect = async (planId: string) => {
   	if (planId === 'free') return;

   	await createCheckoutSession(planId, userId);
   	// Redirects to Stripe checkout
   };
   ```

4. Create webhook handler for Stripe events:
   - Payment successful
   - Subscription cancelled
   - Trial expiring

## Recommended Implementation Steps

1. ✅ Basic paywall system (DONE)
2. Add paywall route to router
3. Add TrialWarningBanner to dashboard
4. Implement Stripe integration
5. Add billing management page
6. Create subscription management UI
7. Add payment method management
8. Implement invoice history

## Environment Variables

```env
REACT_APP_STRIPE_KEY=pk_test_...
REACT_APP_STRIPE_SECRET=sk_test_...
REACT_APP_TRIAL_DURATION_DAYS=14
```

## Testing

### Test Trial Flow

1. Sign up a new user
2. Check user document - should have trial subscription
3. Verify trial countdown on dashboard
4. Mock expiring trial by setting `trialEndsAt` to past timestamp
5. Verify warning banner shows

### Test Paywall

1. Navigate to `/paywall`
2. Verify all plans display correctly
3. Verify "Current Plan" label shows for user's plan
4. Test plan selection buttons

## Future Enhancements

- [ ] Stripe payment integration
- [ ] Automated trial expiration emails
- [ ] Subscription management dashboard
- [ ] Billing history and invoices
- [ ] Plan upgrade/downgrade
- [ ] Promotional codes
- [ ] Team member billing
- [ ] Usage-based analytics


# Pre-Subscription Feature Documentation

## Overview

The pre-subscription feature allows users to subscribe to a paid plan **during their free trial** without any interruption to their service. When a user pre-subscribes, their payment method is stored and the subscription automatically activates when their trial ends, ensuring seamless service continuity.

## User Experience

### Before Pre-Subscription

1. User receives trial expiration warnings (3 days or less remaining)
2. User must subscribe before trial ends or risk service interruption
3. If trial expires without action, user loses access to creation features

### With Pre-Subscription

1. User can subscribe anytime during trial period
2. Payment method is captured immediately
3. **No charges until trial ends**
4. User sees confirmation banner: "You're all set! Your [Plan] subscription will automatically start on [Date]"
5. Full access continues uninterrupted throughout trial and beyond

## Technical Implementation

### Backend Changes

#### 1. Stripe Checkout Session (`functions/stripeFunctions.ts`)

- Added optional `trialEnd` parameter to `createCheckoutSession`
- When `trialEnd` is provided, Stripe creates subscription with `trial_end` parameter
- Subscription metadata includes:
  - `preScheduled: 'true'`
  - `originalTrialEnd: [timestamp]`

```typescript
// Example checkout session with trial_end
const sessionConfig = {
	customer: customerId,
	subscription_data: {
		trial_end: trialEndsAt, // Unix timestamp
		metadata: {
			preScheduled: 'true',
			originalTrialEnd: trialEndsAt.toString(),
		},
	},
	// ... other config
};
```

#### 2. Webhook Handlers

- **`handleSubscriptionCreated`**: Detects pre-scheduled subscriptions and sets:
  - `hasScheduledSubscription: true`
  - `scheduledPlan: [plan_id]`
- **`handleSubscriptionUpdate`**: Updates subscription status when trial ends and subscription activates

#### 3. Firestore User Document

New subscription fields:

- `hasScheduledSubscription?: boolean` - Indicates active pre-scheduled subscription
- `scheduledPlan?: string` - The plan ID that will activate (e.g., 'homeowner', 'professional')

### Frontend Changes

#### 1. Type Updates (`src/Redux/Slices/userSlice.ts`)

Updated `User` and `FamilyAccount` subscription interfaces:

```typescript
subscription?: {
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';
  plan: string;
  // ... existing fields
  hasScheduledSubscription?: boolean;
  scheduledPlan?: string;
};
```

#### 2. Subscription Utilities (`src/utils/subscriptionUtils.ts`)

Updated `SubscriptionData` interface with new fields.

#### 3. Stripe Service (`src/services/stripeService.ts`)

- `createCheckoutSession` now accepts optional `trialEnd` parameter
- Automatically passed when user is in trial period

#### 4. New Component: `ScheduledSubscriptionBanner`

Location: `src/Components/ScheduledSubscriptionBanner/`

Displays when `hasScheduledSubscription === true`:

- ✅ Green confirmation banner
- Shows scheduled plan name
- Shows activation date
- "Manage" button navigates to settings

#### 5. Updated Pages

**DashboardTab**

- Shows `ScheduledSubscriptionBanner` when subscription is pre-scheduled
- Hides `TrialWarningBanner` when subscription is already scheduled

**PaywallPage**

- Shows `ScheduledSubscriptionBanner` at top when pre-scheduled
- Hides trial countdown banner when pre-scheduled
- Passes `trialEnd` to checkout when user is in trial

**SettingsPage**

- Shows `ScheduledSubscriptionBanner` when pre-scheduled
- Displays activation date in subscription section

## Stripe Integration Details

### How Stripe Handles Trial End

1. **Checkout Session Creation**:

   - `subscription_data.trial_end` set to user's existing trial end date
   - Payment method collected immediately
   - Status: `trialing`

2. **During Trial Period**:

   - No charges occur
   - User has full access via trial
   - Subscription exists but in `trialing` state

3. **When Trial Ends**:
   - Stripe **automatically** charges the payment method
   - Subscription status changes to `active`
   - Webhook fires: `customer.subscription.updated`
   - Firestore updated via webhook handler

### Webhook Flow

```
User subscribes during trial
         ↓
customer.subscription.created (status: trialing, trial_end: [date])
         ↓
Firestore: hasScheduledSubscription = true
         ↓
[Trial period continues]
         ↓
[Trial end date reached]
         ↓
Stripe auto-charges payment method
         ↓
customer.subscription.updated (status: active)
         ↓
Firestore: status = 'active', hasScheduledSubscription cleared
```

## User Flows

### Flow 1: Pre-Subscribe During Trial

1. User signs up → 14-day trial begins
2. Day 5: User visits Paywall page
3. Selects "Professional" plan → Checkout
4. **Current trial end date automatically applied to Stripe**
5. User enters payment info, completes checkout
6. Redirected with success message
7. Dashboard shows: "✅ You're all set! Your Professional subscription will automatically start on [Feb 28] when your trial ends."
8. User continues with full trial access
9. Feb 28: Stripe charges card, subscription activates automatically
10. User experiences **zero interruption**

### Flow 2: Traditional Upgrade (No Trial End Date)

1. User on expired trial or no trial
2. Selects plan → Checkout (no `trial_end` parameter)
3. Charges immediately
4. Subscription active immediately

## Testing Checklist

### Manual Testing

- [ ] Pre-subscribe during active trial (day 1-14)
- [ ] Verify ScheduledSubscriptionBanner appears after checkout
- [ ] Verify trial warning banner no longer appears
- [ ] Verify no charges until trial ends (check Stripe dashboard)
- [ ] Verify subscription activates on trial end date
- [ ] Verify seamless transition (no service interruption)
- [ ] Test with different plans (Homeowner, Basic, Professional)
- [ ] Test "Manage" button on banner navigates correctly
- [ ] Test expired trial flow (should charge immediately, no trial_end)

### Stripe Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:5001/[project-id]/us-central1/stripeWebhook
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
```

## Benefits

### For Users

- ✅ **No service interruption** - Set it and forget it
- ✅ **Peace of mind** - Subscribe once, never worry about trial expiration
- ✅ **Maximize trial** - Use full 14 days before any charges
- ✅ **Flexibility** - Subscribe anytime during trial at user's convenience

### For Business

- ✅ **Higher conversion** - Users can commit early without losing trial time
- ✅ **Reduced churn** - No last-minute scramble to subscribe
- ✅ **Better UX** - Professional, seamless experience
- ✅ **Predictable revenue** - Know conversions before trial ends

## Edge Cases Handled

1. **User tries to subscribe twice**: Already handled - Stripe uses same customer ID
2. **User cancels pre-scheduled subscription**: Cancel immediately, no charges
3. **Payment method fails on trial end**: Stripe retry logic + webhook handler updates status
4. **User deletes account with pre-scheduled subscription**: Handle in account deletion logic
5. **Stripe payment fails**: `invoice.payment_failed` webhook updates user to `past_due` status

## Future Enhancements

1. **Allow plan changes** during trial period (upgrade/downgrade pre-scheduled plan)
2. **Email notifications** confirming pre-scheduled subscription
3. **Email reminders** 1 day before trial ends and subscription activates
4. **Analytics dashboard** showing pre-subscription conversion rates
5. **A/B testing** different messaging for trial expiration vs pre-subscription

## Related Files

### Backend

- `functions/stripeFunctions.ts` - Stripe integration & webhooks
- `functions/index.ts` - Exports Stripe functions

### Frontend

- `src/services/stripeService.ts` - Stripe service layer
- `src/Components/ScheduledSubscriptionBanner/` - New banner component
- `src/pages/DashboardTab/DashboardTab.tsx` - Dashboard integration
- `src/pages/PaywallPage/PaywallPage.tsx` - Paywall integration
- `src/pages/SettingsPage/SettingsPage.tsx` - Settings integration
- `src/Redux/Slices/userSlice.ts` - User type definitions
- `src/utils/subscriptionUtils.ts` - Subscription utilities

## Support & Troubleshooting

### Common Issues

**Q: User doesn't see scheduled subscription banner after checkout**

- Check Firestore: verify `hasScheduledSubscription` and `scheduledPlan` fields exist
- Check Stripe: verify subscription has `metadata.preScheduled = 'true'`
- Check webhook logs: ensure `customer.subscription.created` fired successfully

**Q: User charged immediately during trial**

- Verify `trialEnd` parameter was passed to checkout session
- Check checkout session in Stripe dashboard for `subscription_data.trial_end`

**Q: Subscription doesn't activate on trial end**

- Check Stripe webhooks are configured and firing
- Verify webhook URL is correct in Stripe dashboard
- Check Firebase Functions logs for webhook errors

## Deployment Notes

1. **Deploy backend first** (Firebase Functions)
2. **Deploy frontend** (React app)
3. **Test webhook connectivity** using Stripe Dashboard → Webhooks → Send test webhook
4. **Monitor Firestore** for proper field updates
5. **Monitor Stripe Dashboard** for subscription statuses

## Monitoring

Key metrics to track:

- Pre-subscription rate (% of trial users who pre-subscribe)
- Time to pre-subscribe (average days into trial when users subscribe)
- Conversion rate improvement (compare with historical non-pre-subscription data)
- Failed payment rate at trial end
- User satisfaction (reduced support tickets about trial expiration)


# Firebase & Stripe Setup Guide

This guide will help you set up the Firebase Functions environment variables for Stripe integration.

## Prerequisites

1. **Firebase CLI**: Install the Firebase CLI globally

   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Login**: Authenticate with your Firebase account

   ```bash
   firebase login
   ```

3. **Select Project**: Make sure you're using the correct Firebase project

   ```bash
   firebase use your-project-id
   ```

4. **Stripe Account**: You need a Stripe account with products and prices created

## Quick Setup

### Option 1: Windows (Batch Script)

```bash
setup-firebase-env.bat
```

### Option 2: macOS/Linux (Shell Script)

```bash
chmod +x setup-firebase-env.sh
./setup-firebase-env.sh
```

## Manual Setup

If you prefer to set the variables manually:

```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_YOUR_SECRET_KEY" \
  stripe.homeowner_price_id="price_YOUR_HOMEOWNER_PRICE_ID" \
  stripe.basic_price_id="price_YOUR_BASIC_PRICE_ID" \
  stripe.professional_price_id="price_YOUR_PROFESSIONAL_PRICE_ID"
```

## What You Need from Stripe

### 1. Secret Key

- Go to Stripe Dashboard → Developers → API Keys
- Copy the **Secret Key** (starts with `sk_test_`)

### 2. Price IDs

- Go to Stripe Dashboard → Products
- Create products for each plan (Homeowner, Basic, Professional)
- For each product, create a price
- Copy the **Price ID** (starts with `price_`)

## Environment Variables Reference

### Firebase Functions (Backend)

```
stripe.secret_key: Your Stripe secret key
stripe.homeowner_price_id: Price ID for Homeowner plan
stripe.basic_price_id: Price ID for Basic plan
stripe.professional_price_id: Price ID for Professional plan
```

### Frontend (.env file)

```
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
REACT_APP_STRIPE_HOMEOWNER_PLAN_ID=price_YOUR_HOMEOWNER_PRICE_ID
REACT_APP_STRIPE_BASIC_PLAN_ID=price_YOUR_BASIC_PRICE_ID
REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID=price_YOUR_PROFESSIONAL_PRICE_ID
```

## Next Steps

1. **Run the setup script** to configure Firebase Functions
2. **Deploy functions**: `firebase deploy --only functions`
3. **Update .env file** with frontend Stripe keys
4. **Test the subscription flow** in your app

## Verification

Check that your configuration is set correctly:

```bash
firebase functions:config:get
```

You should see output like:

```
{
  "stripe": {
    "secret_key": "sk_test_...",
    "homeowner_price_id": "price_...",
    "basic_price_id": "price_...",
    "professional_price_id": "price_..."
  }
}
```

## Troubleshooting

- **"command not found"**: Make sure Firebase CLI is installed
- **"not logged in"**: Run `firebase login`
- **"no project selected"**: Run `firebase use your-project-id`
- **Invalid keys**: Double-check your Stripe dashboard for correct keys

## Security Notes

- ✅ **Secret keys** are stored securely in Firebase (not in your repo)
- ✅ **Public keys** are safe to include in frontend code
- ❌ Never commit secret keys to version control


# Stripe Integration Implementation Guide

## Overview

This document describes the Stripe integration for the Property Manager Web App subscription and payment system.

## Architecture

### Frontend Components

- **PaywallPage.tsx**: Main pricing display with Stripe checkout integration
- **stripeService.ts**: Client-side Stripe API wrapper for checkout and subscription management
- **stripe.ts**: Stripe configuration and constants

### Backend Requirements

Your Firebase Cloud Functions need the following endpoints:

1. **POST /api/create-checkout-session**

   - Creates Stripe checkout session
   - Parameters: priceId, userId, email, successUrl, cancelUrl
   - Returns: sessionId

2. **POST /api/verify-checkout-session**

   - Verifies successful payment and updates user subscription in Firestore
   - Parameters: sessionId
   - Returns: subscription data

3. **POST /api/cancel-subscription**

   - Cancels user's Stripe subscription
   - Parameters: subscriptionId
   - Returns: cancellation confirmation

4. **GET /api/subscription-details/:subscriptionId**

   - Retrieves subscription details from Stripe
   - Returns: subscription object

5. **POST /stripe/webhook**
   - Handles Stripe webhook events for subscription lifecycle management
   - Handles: subscription created/updated/deleted/paused/resumed, invoice events, payment methods, discounts
   - Requires: STRIPE_WEBHOOK_SECRET environment variable

## Setup Instructions

### 1. Configure Stripe Account

#### Create Products & Prices in Stripe Dashboard

```
Basic Plan
- Amount: $9.99/month
- ID: price_xxx (copy this)

Professional Plan
- Amount: $24.99/month
- ID: price_xxx (copy this)

Enterprise Plan
- Custom pricing
- ID: price_xxx (copy this)
```

#### Enable Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapp.com/api/webhook/stripe`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `invoice.created`
   - `invoice.finalized`
   - `invoice.upcoming`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
   - `payment_method.attached`
   - `payment_method.detached`
   - `customer.discount.created`
   - `customer.discount.deleted`

### 2. Configure Environment Variables

Create `.env` file in project root:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_xxxxx (or pk_test_xxxxx for development)
REACT_APP_STRIPE_BASIC_PLAN_ID=price_xxxxx
REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID=price_xxxxx
REACT_APP_STRIPE_ENTERPRISE_PLAN_ID=price_xxxxx

# Firebase Configuration (if not already set)
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

### 3. Install Stripe Library

```bash
npm install @stripe/stripe-js
```

### 4. Backend Cloud Functions

Create these Firebase Cloud Functions (Node.js):

```typescript
// functions/stripeCheckout.ts
import * as functions from 'firebase-functions';
import * as Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe.Stripe(process.env.STRIPE_SECRET_KEY!);

export const createCheckoutSession = functions.https.onRequest(
	async (req, res) => {
		try {
			const { priceId, userId, email, successUrl, cancelUrl } = req.body;

			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				customer_email: email,
				subscription_data: {
					items: [{ price: priceId }],
					metadata: {
						userId,
					},
				},
				success_url: successUrl,
				cancel_url: cancelUrl,
				mode: 'subscription',
			});

			res.json({ sessionId: session.id });
		} catch (error) {
			console.error('Checkout session error:', error);
			res.status(500).json({ error: 'Failed to create checkout session' });
		}
	},
);

export const verifyCheckoutSession = functions.https.onRequest(
	async (req, res) => {
		try {
			const { sessionId } = req.body;

			const session = await stripe.checkout.sessions.retrieve(sessionId);

			if (session.payment_status === 'paid' && session.subscription) {
				const subscription = await stripe.subscriptions.retrieve(
					session.subscription as string,
				);

				// Update user subscription in Firestore
				const userId = subscription.metadata?.userId;
				await admin
					.firestore()
					.collection('users')
					.doc(userId)
					.update({
						subscription: {
							status: subscription.status,
							plan: subscription.items.data[0].plan.id,
							currentPeriodStart: subscription.current_period_start,
							currentPeriodEnd: subscription.current_period_end,
							stripeSubscriptionId: subscription.id,
							stripeCustomerId: subscription.customer,
						},
					});

				res.json({ success: true, subscription });
			} else {
				res.status(400).json({ error: 'Payment not completed' });
			}
		} catch (error) {
			console.error('Verification error:', error);
			res.status(500).json({ error: 'Failed to verify session' });
		}
	},
);

export const cancelSubscription = functions.https.onRequest(
	async (req, res) => {
		try {
			const { subscriptionId } = req.body;

			const subscription = await stripe.subscriptions.del(subscriptionId);

			res.json({ success: true, subscription });
		} catch (error) {
			console.error('Cancellation error:', error);
			res.status(500).json({ error: 'Failed to cancel subscription' });
		}
	},
);

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
	const sig = req.headers['stripe-signature'] as string;

	try {
		const event = stripe.webhooks.constructEvent(
			req.rawBody,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET!,
		);

		switch (event.type) {
			case 'customer.subscription.created':
				await handleSubscriptionCreated(event.data.object);
				break;
			case 'customer.subscription.updated':
				await handleSubscriptionUpdate(event.data.object);
				break;
			case 'customer.subscription.deleted':
				await handleSubscriptionCancellation(event.data.object);
				break;
			case 'customer.subscription.paused':
				await handleSubscriptionPaused(event.data.object);
				break;
			case 'customer.subscription.resumed':
				await handleSubscriptionResumed(event.data.object);
				break;
			case 'invoice.payment_succeeded':
				await handlePaymentSuccess(event.data.object);
				break;
			case 'invoice.payment_failed':
				await handlePaymentFailure(event.data.object);
				break;
			case 'invoice.payment_action_required':
				await handlePaymentActionRequired(event.data.object);
				break;
			// ... additional event handlers
			default:
				console.log('Unhandled Stripe event type:', event.type);
		}

		res.json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		res.status(400).send(`Webhook Error: ${error}`);
	}
});
```

### 5. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

## Usage

### Frontend Flow

1. **User Registration**

   - User signs up at `/register`
   - Auto-created trial subscription (14 days)
   - Redirected to `/paywall`

2. **Paywall Page**

   - Displays all available plans
   - Shows trial countdown
   - "Upgrade" button initiates Stripe checkout

3. **Checkout Flow**

   - User clicks "Upgrade to [Plan]"
   - Redirected to Stripe checkout page
   - User enters payment details
   - On success: subscription created, user redirected to dashboard
   - On cancel: returns to paywall

4. **Dashboard**
   - Trial warning banner shows if trial < 3 days
   - User can click to upgrade anytime

## Plan Management

### Changing Plans

Users can upgrade/downgrade by visiting `/paywall` and selecting a new plan.

### Cancellation

Implement in settings page:

```typescript
const cancelSub = async () => {
	const subscriptionId = user.subscription.stripeSubscriptionId;
	await cancelSubscription(subscriptionId);
	// Update local state
};
```

## Pricing Structure

| Plan         | Price     | Features                               |
| ------------ | --------- | -------------------------------------- |
| Free Trial   | $0/mo     | All features for 14 days               |
| Basic        | $9.99/mo  | Core property management               |
| Professional | $24.99/mo | Advanced reporting, team collaboration |
| Enterprise   | Custom    | Custom features, dedicated support     |

## Security Considerations

1. **API Keys**: Store secret key in Firebase environment variables, never in frontend
2. **Webhook Verification**: Always verify webhook signatures
3. **User Verification**: Verify user identity before processing payments
4. **PCI Compliance**: Never handle raw card data (Stripe handles this)

## Testing

### Automated Sandbox Commands

```bash
# Backend Stripe sandbox smoke test
npm run test:stripe:sandbox

# Backend Stripe card matrix (valid/declined/auth-required)
npm run test:stripe:cards:sandbox

# Webhook sandbox signed-event test
npm run test:stripe:webhook:sandbox

# Frontend Stripe checkout E2E (Playwright)
npm run test:stripe:e2e

# Run all sandbox tests
npm run test:stripe:all
```

### Sandbox Environment Requirements

Use Stripe **test-mode** credentials and IDs:

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxx
REACT_APP_STRIPE_HOMEOWNER_PLAN_ID=price_xxxxx
```

Optional overrides:

```env
STRIPE_TEST_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_WEBHOOK_TEST_URL=https://us-central1-<project>.cloudfunctions.net/stripeWebhook
```

### Sandbox Test Behavior

- `test:stripe:sandbox` fails fast unless `STRIPE_SECRET_KEY` starts with `sk_test_`.
- `test:stripe:cards:sandbox` validates multiple test payment methods (`pm_card_visa`, `pm_card_mastercard`, `pm_card_chargeDeclined`, `pm_card_chargeDeclinedInsufficientFunds`, `pm_card_authenticationRequired`) and asserts expected outcomes.
- `test:stripe:webhook:sandbox` sends a signed test webhook event to your deployed endpoint (requires `STRIPE_WEBHOOK_SECRET` and `STRIPE_WEBHOOK_TEST_URL` set).
- `test:stripe:e2e` payment tests run only when `REACT_APP_STRIPE_PUBLIC_KEY` starts with `pk_test_`, and include hosted checkout card coverage for valid and declined cards when hosted checkout is available.
- Use Stripe CLI/webhook forwarding in test mode for local development webhook validation (`stripe listen --forward-to localhost:5001/<project>/us-central1/stripeWebhook`).

### Test Card Numbers

```
Visa: 4242 4242 4242 4242
Mastercard: 5555 5555 5555 4444
Amex: 3782 822463 10005
```

Use any future date for expiration and any 3-digit CVC.

### Testing Scenarios

1. **Successful payment**: Use 4242 card
2. **Declined card**: Use 4000 0000 0000 0002
3. **3D Secure**: Use 4000 0025 0000 3155

## Troubleshooting

### Common Issues

1. **"Stripe not initialized"**

   - Check REACT_APP_STRIPE_PUBLIC_KEY is set
   - Verify @stripe/stripe-js is installed

2. **"Failed to create checkout session"**

   - Verify backend Cloud Function is deployed
   - Check userId and email are valid
   - Review Cloud Function logs

3. **"Payment session not found"**
   - Session may have expired (24 hour limit)
   - User may have navigated away from checkout

## Next Steps

1. Deploy Cloud Functions with Stripe implementation
2. Set environment variables in Firebase
3. Configure Stripe webhooks
4. Test with test card numbers
5. Create subscription management UI in settings
6. Monitor Stripe dashboard for issues

## Resources

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Checkout Integration](https://stripe.com/docs/checkout)
- [Stripe Subscription Management](https://stripe.com/docs/billing/subscriptions/overview)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
