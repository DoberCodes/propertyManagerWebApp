import type { HelpfulArticle } from '../types';

export const reportsExportsArticle: HelpfulArticle = {
	slug: 'reports-and-property-exports',
	title: 'Create reports and property exports',
	summary: 'Filter existing Maintley records and download a useful point-in-time CSV export.',
	path: '/reports',
	actionLabel: 'Go to Reports',
	introduction: 'Reports are derived views of information already stored in Maintley. They help you review or export records without becoming a separate source of truth.',
	sections: [
		{ heading: 'When to use Reports', paragraphs: [
			'Use Reports when you need a focused view of property, equipment, task, maintenance, contractor, resident, team, or portfolio information. A CSV export can support a handoff, offline review, tax preparation, contractor discussion, or personal backup, but it reflects the records available at the time it is created.',
		] },
		{ heading: 'Build and export a report', steps: [
			'Open Reports and choose a report category and available report type.',
			'Select the relevant property, date range, and other filters.',
			'Choose columns that answer the question without including unnecessary information.',
			'Review the results for missing or incorrect source records.',
			'Export the report as CSV and save it in an appropriate secure location.',
		] },
		{ heading: 'What the export contains', paragraphs: [
			'The export contains the filtered fields shown by the report builder. Editing the CSV does not edit Maintley. Correct the underlying property, equipment, task, or Maintenance History record in Maintley, then create a new export when you need an updated copy.',
			'Data export, property filtering, date filtering, custom columns, and CSV export are available across standard plans. Specific report types can still depend on account role and access to financial, resident, team, portfolio, or assigned-property information.',
		] },
		{ heading: 'Troubleshooting and privacy', tips: [
			'If a report is missing, check your role and whether the report needs a property or business capability your account does not use.',
			'If rows are missing, clear overly narrow filters and confirm access to the relevant properties.',
			'If data is wrong, correct the source record instead of editing only the exported copy.',
			'Treat exports as copies of account information and share them only with appropriate people.',
			'Maintley Intelligence observations are separate from standard data exports.',
		] },
	],
	relatedGuideSlugs: ['build-a-useful-property-record', 'team-member-access-and-permissions', 'account-security-and-deletion'],
};
