import type { HelpfulArticle } from '../types';

export const teamPermissionsArticle: HelpfulArticle = {
	slug: 'team-member-access-and-permissions',
	title: 'Manage team-member access and permissions',
	summary: 'Choose roles and property assignments without transferring account ownership or billing.',
	path: '/team',
	actionLabel: 'Go to Team',
	introduction: 'Business team access lets people work inside the account according to their role and property scope. It is separate from family, resident, contractor, and Maintley staff access.',
	sections: [
		{ heading: 'Plan and role requirements', paragraphs: [
			'Team collaboration begins on the Property plan, where team members currently operate as administrators across the account. Portfolio adds custom roles, property assignments, maintenance roles, and owner-specific access. Team members do not own the subscription, Stripe customer, or account billing.',
		] },
		{ heading: 'Invite and review a team member', steps: [
			'Open Team and confirm that your own role allows team management.',
			'Invite the person using their individual work email.',
			'On Portfolio, choose the smallest suitable role and only the properties required for their work.',
			'After acceptance, confirm the person can open the expected properties and tasks but not unrelated areas.',
			'Update or remove access promptly when responsibilities change.',
		] },
		{ heading: 'How permissions behave', paragraphs: [
			'Application controls may hide or disable actions the role cannot perform, while Firestore and Storage rules enforce access to the underlying records and files. Property assignment limits scope; assigning a task does not bypass that property scope. Some actions, including account management and destructive changes, remain limited to account managers.',
			'When access is removed, the person’s future access changes but records they created for the account remain part of the account history. Do not delete Maintenance History simply because the employee who recorded it has left.',
		] },
		{ heading: 'Common problems', tips: [
			'If Team is missing, check both the current plan and your own management permission.',
			'If someone sees no properties, review accepted account membership and property assignments.',
			'If someone sees too much, reduce the Portfolio role or assigned-property scope immediately.',
			'Give each worker an individual invitation so administrator access and activity remain attributable.',
			'Use family access for household collaboration and resident access for maintenance requests.',
		] },
	],
	relatedGuideSlugs: ['work-with-family-and-team-members', 'reports-and-property-exports'],
};
