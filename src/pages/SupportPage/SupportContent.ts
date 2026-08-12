export {
	getHelpfulArticle,
	getRelatedHelpfulArticles,
	helpfulArticles,
} from './content';
export type { ArticleSection, HelpfulArticle } from './content';

export const supportFaqItems = [
	{
		question: 'How do I report a problem or request a feature?',
		answer: 'Select New support request, choose the request type, and include what happened or what you would like Maintley to do. Screenshots are helpful when something is not working correctly.',
	},
	{
		question: 'Where can I check the status of my request?',
		answer: 'Open My requests in the Support Center to review active requests, closed requests, and the latest Maintley update.',
	},
	{
		question: "Why can't I see the Team page?",
		answer: 'Team access depends on your plan and account permissions. The account owner or an administrator may need to update your access.',
	},
	{
		question: 'How do subscriptions work?',
		answer: 'Maintley includes a free plan and optional paid plans. You can review your current plan and available features from the account plan area.',
	},
	{
		question: 'Can I invite family members to my account?',
		answer: 'Yes. Account owners can invite family members from Settings when their plan and account type allow it.',
	},
	{
		question: 'Where can I review legal documents?',
		answer: 'Open Legal from Settings to review the Terms of Service, Privacy Policy, Maintenance Disclaimer, Subscription Terms, and EULA.',
	},
	{
		question: 'Why do I need to review document suggestions?',
		answer: 'Maintley may find possible maintenance, contractor, warranty, cost, or property details in uploaded documents. Review those suggestions before applying them so the information is saved to the right property and record.',
	},
];

export const supportKnownIssues = [
	'Ad or privacy blockers may interfere with support request submission.',
	'If mobile notifications are not arriving, review both device permissions and Maintley notification settings.',
	'Changes may take a moment to appear when the device has an unstable connection.',
	'Document review may miss details in scanned PDFs, low-quality images, or unusual invoice formats. Review suggestions before applying them.',
];

export const bugReportChecklist = [
	'What you expected to happen',
	'What actually happened',
	'The steps that led to the problem',
	'Your device or browser',
	'Screenshots, when they help explain the issue',
];

export const recentMaintleyUpdates = [
	{
		version: '2.14.0',
		date: 'August 12, 2026',
		type: 'Feature',
		title: 'A more connected property record',
		description:
			'Organize Spaces such as bedrooms, garages, lawns, and utility areas; keep filters, paint, parts, and other Supplies with the property; and connect Equipment, Tasks, Documents, Spaces, and Supplies without creating duplicate records. Property setup can also prepare common Spaces from the home profile and accepted equipment details.',
	},
	{
		version: '2.12.0',
		date: 'July 26, 2026',
		type: 'Feature',
		title: 'Complimentary access codes',
		description:
			'Eligible access codes can now be reviewed and activated during registration or later from Billing & Subscription. Maintley shows the access level, duration, and what happens afterward before activation.',
	},
	{
		version: '2.11.0',
		date: 'July 25, 2026',
		type: 'Feature',
		title: 'Homeowner+ after your first property',
		description:
			'Eligible new Free accounts now receive 30 days of Homeowner+ after creating their first property. No payment method is required, and continuing with a paid plan is optional.',
	},
	{
		version: '2.10.0',
		date: 'July 25, 2026',
		type: 'Billing update',
		title: 'Clearer upgrades from complimentary access',
		description:
			'When you choose a paid plan while using complimentary access, checkout now explains whether billing begins immediately or after your complimentary period. A paid subscription is created only when you intentionally continue through Stripe Checkout.',
	},
	{
		version: '2.9.0',
		date: 'July 25, 2026',
		type: 'Reliability update',
		title: 'Granted access stays with you',
		description:
			'Features supplied through a Maintley access grant now remain available as you move between pages and return to Today.',
	},
	{
		version: '2.8.3',
		date: 'July 23, 2026',
		type: 'Experience update',
		title: 'A smoother path through checkout',
		description:
			'Registration, checkout, and onboarding now happen in a clearer order. Interrupted checkout can be resumed, while customers who decide not to continue can enter Maintley on the Free plan.',
	},
];
