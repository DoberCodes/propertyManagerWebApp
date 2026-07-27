import type { HelpfulArticle } from '../types';

export const familyAndTeamArticle: HelpfulArticle = {
	slug: 'work-with-family-and-team-members',
	title: 'Work with family and team members',
	summary: 'Share maintenance work while keeping access, assignments, and account ownership clear.',
	path: '/settings',
	actionLabel: 'Open Settings',
	introduction: 'Family members and business team members can collaborate in Maintley, but they represent different relationships. Choose the one that matches how the person participates in the property record.',
	founderNote: ['Shared access works best when each person can see the property context they need and everyone records completed work in Maintley instead of leaving the history scattered across messages.'],
	sections: [
		{
			heading: 'Choose family or team access',
			paragraphs: [
				'Use family access for a spouse, partner, parent, adult child, caregiver, or roommate participating in the same household account. Family members join the existing account, share property information, and can receive task assignments. They are not business team members and do not run owner onboarding.',
				'Use team access for business collaboration on Property or Portfolio plans. Property-plan team members currently operate as administrators with access across the account. Portfolio supports more detailed roles, property assignments, maintenance roles, and owner-specific visibility. A contractor saved in the contractor directory is not automatically a signed-in team member.',
			],
		},
		{
			heading: 'A realistic example',
			paragraphs: [
				'A homeowner invites their spouse as a family member and assigns the task of scheduling an annual furnace inspection. Both people can refer to the same property, equipment, documents, and Maintenance History. Billing remains with the account owner.',
				'A small property business instead invites an employee through team management. On a Portfolio plan, the owner assigns only the relevant properties and chooses a maintenance-focused role. The employee sees assigned work and records completion details, while billing, account ownership, and broader administrative controls stay outside that role.',
			],
			image: {
				src: '/screenshots/desktop_dashboard.png',
				alt: 'Today focus controls showing personal and broader work views.',
				caption: 'Personal focus helps collaborators start with relevant work while authorized managers retain broader context.',
			},
		},
		{
			heading: 'Set up shared work step by step',
			steps: [
				'Decide whether the person is participating as family, a business team member, a resident, or simply a contractor record.',
				'Open the relevant account or team settings and send the invitation to the correct email address.',
				'For Portfolio team access, choose the smallest role and property assignment that supports the person’s responsibilities.',
				'Ask the person to accept the invitation with the intended email rather than creating an unrelated account.',
				'Assign tasks when that person owns the next action, and include the correct property and equipment context.',
				'Have the assignee complete work with service details and attachments so the result becomes part of the shared property history.',
				'Review access when responsibilities or property assignments change.',
			],
		},
		{
			heading: 'What happens after each action',
			paragraphs: [
				'An invitation does not transfer ownership of the account or subscription. After acceptance, the person operates within the existing account relationship and permission boundaries. Assigning a task identifies responsibility for the action; it does not grant access to a property the person otherwise cannot open.',
				'Removing access should prevent future access according to the account relationship and permission model, while property records and Maintenance History remain with the account. Team members do not own subscriptions, Stripe customers, or billing management. Residents use maintenance-request workflows and are not substitutes for family or team access.',
			],
		},
		{
			heading: 'Common mistakes',
			tips: [
				'Use family access for household collaboration, including when assigning tasks.',
				'Use a contractor directory entry when the person does not need to sign in.',
				'Confirm property access before assigning work because assignment does not expand a person’s property scope.',
				'Invite each person separately so actions and access remain attributable.',
				'Record completed service results in Maintley so they remain part of the shared history.',
			],
		},
		{
			heading: 'Troubleshooting, plans, and permissions',
			paragraphs: [
				'Standard plans include up to three family members and shared property records, documents, Maintenance History, and task assignment. Business team collaboration begins on the Property plan. Advanced roles and property assignments require Portfolio. The account owner manages billing; team members and residents do not.',
				'If an invitation is missing, verify the email address and ask the recipient to check filtered mail before sending duplicates. If someone can sign in but cannot see a property, confirm that they joined the intended account and, for restricted Portfolio roles, that the property is assigned. If the Team page is missing, the current plan or account permission may not include team management.',
			],
		},
	],
	relatedGuideSlugs: ['team-member-access-and-permissions', 'how-tasks-become-maintenance-history', 'build-a-useful-property-record'],
};
