export const supportFaqItems = [
	{
		question: 'How do I report a problem or request a feature?',
		answer:
			'Select New support request, choose the request type, and include what happened or what you would like Maintley to do. Screenshots are helpful when something is not working correctly.',
	},
	{
		question: 'Where can I check the status of my request?',
		answer:
			'Open My requests in the Support Center to review active requests, closed requests, and the latest Maintley update.',
	},
	{
		question: "Why can't I see the Team page?",
		answer:
			'Team access depends on your plan and account permissions. The account owner or an administrator may need to update your access.',
	},
	{
		question: 'How do subscriptions work?',
		answer:
			'Maintley includes a free plan and optional paid plans. You can review your current plan and available features from the account plan area.',
	},
	{
		question: 'Can I invite family members to my account?',
		answer:
			'Yes. Account owners can invite family members from Settings when their plan and account type allow it.',
	},
	{
		question: 'Where can I review legal documents?',
		answer:
			'Open Legal from Settings to review the Terms of Service, Privacy Policy, Maintenance Disclaimer, Subscription Terms, and EULA.',
	},
	{
		question: 'Why do I need to review document suggestions?',
		answer:
			'Maintley may find possible maintenance, contractor, warranty, cost, or property details in uploaded documents. Review those suggestions before applying them so the information is saved to the right property and record.',
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
		version: '2.7.15',
		date: 'June 30, 2026',
		type: 'Experience update',
		title: 'Property context on task cards',
		description:
			'The all-properties Tasks view now shows the related property on each task card, making similar recurring work easier to tell apart.',
	},
	{
		version: '2.7.14',
		date: 'June 30, 2026',
		type: 'Account update',
		title: 'Profile and password improvements',
		description:
			'The profile page now keeps profile photos constrained and adds show or hide controls when changing a password.',
	},
	{
		version: '2.7.10',
		date: 'June 30, 2026',
		type: 'Feature',
		title: 'Maintley Intelligence on the dashboard',
		description:
			'The dashboard can now show a focused Maintley Intelligence suggestion based on records across the homes in view.',
	},
	{
		version: '2.7.8',
		date: 'June 30, 2026',
		type: 'Feature',
		title: 'Document review for property records',
		description:
			'Uploaded invoices, receipts, warranties, and service documents can surface reviewable maintenance, contractor, warranty, cost, and property-match details before anything is applied.',
	},
	{
		version: '2.7.6',
		date: 'June 30, 2026',
		type: 'Experience update',
		title: 'Personal dashboard focus',
		description:
			'Dashboard scope can focus on assigned work or broaden to all visible work, helping owners, family members, and team members reduce noise.',
	},
	{
		version: '2.7.4',
		date: 'June 30, 2026',
		type: 'Feature',
		title: 'Contractor website and portal links',
		description:
			'Contractor records now support website and customer portal links, while company name remains the only required field.',
	},
	{
		version: '2.5.9',
		date: 'June 20, 2026',
		type: 'Feature',
		title: 'Customizable property groups',
		description:
			'Create, reorder, rename, customize, move, and remove property groups from a more focused management experience.',
	},
	{
		version: '2.5.0',
		date: 'June 18, 2026',
		type: 'Feature',
		title: 'Customer support ticket tracking',
		description:
			'Support requests include ticket numbers, customer-visible status updates, attachments, and improved follow-up.',
	},
];

interface ArticleSection {
	heading: string;
	paragraphs?: string[];
	steps?: string[];
	tips?: string[];
	image?: {
		// Use paths like /assets/images/article_screenshots/properties-overview.png.
		src: string;
		alt: string;
		caption?: string;
	};
}

export interface HelpfulArticle {
	slug: string;
	title: string;
	summary: string;
	readTime: string;
	path: string;
	actionLabel: string;
	introduction: string;
	founderNote: string[];
	sections: ArticleSection[];
}

export const helpfulArticles: HelpfulArticle[] = [
	{
		slug: 'build-a-useful-property-record',
		title: 'Build a useful property record',
		summary:
			'Create the foundation for appliances, tasks, documents, contractors, and maintenance history.',
		readTime: '5 min read',
		path: '/properties',
		actionLabel: 'Go to Properties',
		introduction:
			'A property record is the main home for everything Maintley knows about a property. It connects the address, systems, tasks, documents, contractors, and completed maintenance in one place.',
		founderNote: [
			'Maintley is most useful when each record has clear property context. Start with the property, then let tasks, documents, and maintenance history build around it.',
			'The goal is not to finish every detail on day one. The goal is to create a reliable place for information to collect over time.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Properties are the primary organizational unit in Maintley. A property can hold appliances and systems, tasks, documents, contractors, tenants, and Maintenance History.',
					'If you manage more than one property, groups can make the Properties page easier to scan without changing ownership, billing, or access rules.',
				],
				image: {
					src: '/screenshots/desktop_multiproperty.png',
					alt: 'Properties page showing property groups and property cards.',
					caption:
						'Use the Properties page as the starting point for records, systems, tasks, and documents.',
				},
			},
			{
				heading: 'How to start',
				steps: [
					'Add the real property address and a recognizable property name.',
					'Add the most important appliances or systems first.',
					'Create tasks for work that needs attention.',
					'Attach documents to the property, system, task, or completed maintenance record they support.',
				],
			},
			{
				heading: 'What gets saved',
				paragraphs: [
					'Maintley saves property details together with linked systems, tasks, files, contractors, and maintenance records. Optional fields can stay blank until you have verified information.',
					'Over time, normal maintenance activity turns the property record into a practical history of what happened, when it happened, and what records support it.',
				],
				tips: [
					'Use names another person would recognize.',
					'Add verified details when work happens.',
					'Keep supporting documents close to the record they explain.',
				],
			},
		],
	},
	{
		slug: 'how-tasks-become-maintenance-history',
		title: 'Turn tasks into maintenance history',
		summary:
			'Use tasks for planned work and completion details for the permanent maintenance record.',
		readTime: '5 min read',
		path: '/tasks',
		actionLabel: 'Go to Tasks',
		introduction:
			'Tasks manage work that still needs attention. When a task is completed with service details, it helps build the long-term Maintenance History for the property.',
		founderNote: [
			'A completed task should not disappear without context. Future you should be able to see who did the work, what changed, and what evidence supports the record.',
			'That is why task completion matters. The task handles the action, and the completion details preserve the result.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Tasks track repairs, inspections, recurring reminders, and other maintenance work. Maintenance History records completed work after the fact.',
					'When you complete a task with notes, files, cost, contractor, or linked system details, Maintley keeps that information connected to the property record.',
				],
			},
			{
				heading: 'How to use it',
				steps: [
					'Create a task with a clear action title.',
					'Link the correct property and appliance or system when possible.',
					'Assign the task if someone else owns the next action.',
					'When the work is finished, complete the task and add the service details.',
				],
				image: {
					src: '/screenshots/desktop_tasks.png',
					alt: 'Tasks page showing maintenance task cards with property context.',
					caption:
						'Task cards should show the action, due status, assignment, and related property.',
				},
			},
			{
				heading: 'What to include at completion',
				paragraphs: [
					'Add what was done, who did it, when it happened, what it cost, and whether follow-up work is needed. Attach invoices, photos, receipts, or service reports when they help explain the work.',
				],
				tips: [
					'Write the result, not only that the task was done.',
					'Include part numbers or measurements when they may matter later.',
					'Create a new task for recommended follow-up work.',
				],
			},
		],
	},
	{
		slug: 'track-appliances-and-home-systems',
		title: 'Track appliances and home systems',
		summary:
			'Keep equipment details, parts, documents, tasks, and service history connected.',
		readTime: '5 min read',
		path: '/devices',
		actionLabel: 'Go to Appliances',
		introduction:
			'Appliance and system profiles keep model details, service records, parts, documents, and linked tasks in one place.',
		founderNote: [
			'Equipment details are easiest to capture when you are standing next to the system or reviewing a service record.',
			'Maintley helps preserve that information so a future repair, warranty question, or replacement does not start from scratch.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Use appliance and system profiles for equipment you maintain, repair, replace, or reference during service work. Common examples include HVAC systems, water heaters, appliances, roofs, generators, pumps, and safety equipment.',
					'Each profile can hold manufacturer details, model and serial numbers, install dates, filters, parts, notes, documents, tasks, and Maintenance History.',
				],
				image: {
					src: '/screenshots/desktop_appliance.png',
					alt: 'Appliance or system profile showing equipment details and linked records.',
					caption:
						'Appliance and system profiles keep service details, files, tasks, and history connected.',
				},
			},
			{
				heading: 'What to record',
				steps: [
					'Name the equipment clearly and connect it to the correct property.',
					'Add location, manufacturer, model, serial number, and install date when known.',
					'Attach manuals, warranties, receipts, label photos, or service files.',
					'Link related tasks before completing maintenance work.',
				],
			},
			{
				heading: 'How this helps later',
				paragraphs: [
					'A complete enough profile helps you order parts, answer contractor questions, check warranty coverage, and understand the service history for that specific system.',
				],
				tips: [
					'Photograph the model and serial label.',
					'Record filter sizes and commonly replaced parts.',
					'Leave unknown fields blank until they are verified.',
				],
			},
		],
	},
	{
		slug: 'keep-property-documents-organized',
		title: 'Keep property documents organized',
		summary:
			'Store manuals, warranties, receipts, invoices, and photos with the records they support.',
		readTime: '4 min read',
		path: '/properties',
		actionLabel: 'Choose a Property',
		introduction:
			'Documents are most useful when they are attached to the property, system, task, or completed maintenance record they explain.',
		founderNote: [
			'Storage alone is not organization. The useful part is the context around the file.',
			'Putting a document near the thing it describes makes it easier to find and easier to trust later.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Maintley can store manuals, warranties, receipts, invoices, inspection reports, photos, and other supporting records. Files can support broad property context or specific equipment and maintenance records.',
				],
			},
			{
				heading: 'Where to attach files',
				steps: [
					'Attach general inspections or property photos to the property.',
					'Attach manuals, warranties, label photos, and equipment receipts to the appliance or system.',
					'Attach invoices, service reports, receipts, and work photos to the completed maintenance record.',
				],
				image: {
					src: '/screenshots/desktop_documents.png',
					alt: 'Document area showing files attached to a property or maintenance record.',
					caption:
						'Attach files to the record they support so they are easier to find later.',
				},
			},
			{
				heading: 'How to keep files useful',
				paragraphs: [
					'Use file names that identify the equipment, contractor, document type, or date. The name only needs to make sense when you find it months or years later.',
					'A file is supporting evidence. Add a short maintenance note when you need the record to explain what happened.',
				],
				tips: [
					'Upload records soon after receiving them.',
					'Keep invoices with the work they document.',
					'Remove duplicates when a clearer copy is available.',
				],
			},
		],
	},
	{
		slug: 'review-document-suggestions',
		title: 'Review document suggestions',
		summary:
			'Understand document review, property matching, and why suggested changes require approval.',
		readTime: '4 min read',
		path: '/properties',
		actionLabel: 'Choose a Property',
		introduction:
			'Document review helps turn useful information from invoices, receipts, warranties, and service records into better property records. Suggestions require your approval before they are applied.',
		founderNote: [
			'Document review should reduce manual entry without silently rewriting important records.',
			'The original file remains the source. Maintley helps surface what may be useful, and you decide what belongs in the property record.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'When supported document text is available, Maintley may suggest maintenance history, contractor information, warranty context, costs, parts, system details, or a possible property match.',
					'These suggestions come from the uploaded record. They are not an inspection, diagnosis, or automatic correction.',
				],
			},
			{
				heading: 'How to review suggestions',
				steps: [
					'Check the review summary for new records, updates, warnings, and items that need attention.',
					'Confirm whether the document should be used for the selected property.',
					'Review contractor, service date, invoice total, warranty, and system details.',
					'Apply only the suggestions that are useful and accurate.',
				],
				image: {
					src: '/screenshots/desktop_suggestedDetails.png',
					alt: 'Document review screen showing a summary of suggested records, updates, and warnings.',
					caption:
						'The review summary shows what Maintley found before you apply any suggested changes.',
				},
			},
			{
				heading: 'Current limits',
				paragraphs: [
					'Clear text-based records work best. Scanned PDFs, low-quality images, handwritten notes, unusual invoice layouts, and multi-document packets may miss details or need manual review.',
				],
				tips: [
					'Use clear photos or text-based PDFs when possible.',
					'Review suggestions while the context is fresh.',
					'Keep the original file attached as supporting evidence.',
				],
			},
		],
	},
	{
		slug: 'set-up-maintenance-reminders',
		title: 'Set up useful maintenance reminders',
		summary:
			'Use task reminders, recurring schedules, and notification settings to keep maintenance visible.',
		readTime: '4 min read',
		path: '/settings?category=notifications',
		actionLabel: 'Open Notification Settings',
		introduction:
			'Reminders help important maintenance return to your attention at the right time. They work best when they are tied to clear tasks and realistic due dates.',
		founderNote: [
			'The best reminder system is one you still trust.',
			'Use reminders for maintenance that matters, keep stale tasks cleaned up, and adjust notification channels to match how you actually work.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Maintley supports task due dates, recurring schedules, overdue reminders, in-app notifications, and mobile push notifications where available.',
					'Notification behavior can depend on account settings, plan availability, device permissions, and connection quality.',
				],
			},
			{
				heading: 'How to set reminders',
				steps: [
					'Create or edit a task and add a due date.',
					'Enable recurrence for work that repeats.',
					'Turn on the reminder channels you want in Notification Settings.',
					'Confirm mobile or browser permissions if you use push notifications.',
				],
				image: {
					src: '/screenshots/desktop_taskcreate.png',
					alt: 'Notification settings or task reminder controls in Maintley.',
					caption:
						'Reminder settings work best when tasks have clear due dates and recurrence rules.',
				},
			},
			{
				heading: 'If reminders do not arrive',
				paragraphs: [
					'Start with the task, then check account settings and the device. A task needs a due date and enabled reminders before Maintley can notify you.',
				],
				tips: [
					'Complete or reschedule stale overdue tasks.',
					'Use custom schedules for work that needs more lead time.',
					'Check device notification permissions after app or browser updates.',
				],
			},
		],
	},
	{
		slug: 'organize-properties-with-groups',
		title: 'Organize multiple properties with groups',
		summary:
			'Use groups to make a portfolio easier to scan without changing access or ownership.',
		readTime: '4 min read',
		path: '/properties',
		actionLabel: 'Manage Property Groups',
		introduction:
			'Groups organize the Properties page by portfolio, region, ownership, property type, or another practical category.',
		founderNote: [
			'Groups should make a portfolio easier to scan. They should not feel like another ownership system.',
			'A few clear groups usually work better than a detailed structure that needs constant upkeep.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Groups let you create, rename, reorder, collapse, customize, and remove visual sections on the Properties page.',
					'Groups do not change property ownership, billing, team access, or permissions.',
				],
			},
			{
				heading: 'How to use groups',
				steps: [
					'Create a group with a clear name and optional description.',
					'Choose an icon and color for quick recognition.',
					'Move properties into the group.',
					'Reorder or collapse groups based on how you manage the portfolio.',
				],
				image: {
					src: '/screenshots/desktop_multiproperty.png',
					alt: 'Property groups being used to organize multiple properties.',
					caption:
						'Groups make larger property lists easier to scan without changing access or ownership.',
				},
			},
			{
				heading: 'Best practices',
				paragraphs: [
					'Use group names that describe how you actually think about the properties. If a group becomes empty or confusing, move its properties and remove it.',
				],
				tips: [
					'Keep group names short.',
					'Use colors consistently.',
					'Prefer fewer useful groups over many nearly empty groups.',
				],
			},
		],
	},
	{
		slug: 'get-started-without-documenting-everything',
		title: 'Get started without documenting everything',
		summary:
			'Build a useful record gradually by starting with the next maintenance action.',
		readTime: '4 min read',
		path: '/dashboard',
		actionLabel: 'Return to Dashboard',
		introduction:
			'Maintley does not require a complete property inventory before it becomes useful. Start with the next real maintenance need and build from there.',
		founderNote: [
			'Property documentation should not become another overwhelming project.',
			'A small number of accurate records is more useful than a large setup effort filled with guesses.',
		],
		sections: [
			{
				heading: 'What to do first',
				steps: [
					'Add the property and address.',
					'Add the equipment involved in current or upcoming work.',
					'Create the task or record recently completed maintenance.',
					'Attach the document or photo you already have.',
				],
				image: {
					src: '/screenshots/desktop_setupassistant.png',
					alt: 'Dashboard or property setup view showing a simple first maintenance action.',
					caption:
						'Start with one real property, one useful record, and the next maintenance action.',
				},
			},
			{
				heading: 'What can wait',
				paragraphs: [
					'Leave unknown install dates, model numbers, costs, and service details blank until they can be verified from an equipment label, invoice, contractor, or other record.',
					'An incomplete factual record is better than a complete-looking record built from estimates.',
				],
			},
			{
				heading: 'How to keep momentum',
				paragraphs: [
					'Add information when maintenance happens. Each task, document, and completed service record improves the property record without requiring a separate documentation project.',
				],
				tips: [
					'Keep the first session short.',
					'Prioritize active problems and expensive equipment.',
					'Return to older records when new evidence becomes available.',
				],
			},
		],
	},
	{
		slug: 'use-property-intelligence-recommendations',
		title: 'Use Maintley Intelligence recommendations',
		summary:
			'Understand recommendations, why they appear, and how to decide what to act on.',
		readTime: '5 min read',
		path: '/dashboard',
		actionLabel: 'Review Recommendations',
		introduction:
			'Maintley Intelligence reviews saved property records and highlights a small number of useful next steps. Recommendations are guidance, not inspections or property grades.',
		founderNote: [
			'Maintley Intelligence should help people notice worthwhile next steps without making the property feel judged.',
			'Recommendations are most useful when they explain what Maintley found and what action would improve the record.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Recommendations may suggest adding a recurring task, recording an install date, uploading warranty information, completing missing system details, or reviewing a maintenance pattern.',
					'They are based on Maintley records. They do not diagnose equipment condition or confirm what is physically happening at a property.',
				],
			},
			{
				heading: 'How to read recommendations',
				paragraphs: [
					'Look for the action, the property context, and the reason the recommendation appeared. In cross-property views, the property name helps you understand where the action belongs.',
				],
				image: {
					src: '/screenshots/desktop_dashboard.png',
					alt: 'Maintley Intelligence recommendation card with property context.',
					caption:
						'Maintley Intelligence recommendations should explain the action and where it belongs.',
				},
			},
			{
				heading: 'How to decide what to do',
				steps: [
					'Act on recommendations tied to current maintenance or safety-related routines.',
					'Verify factual information from labels, invoices, manuals, warranties, or contractors.',
					'Skip or defer suggestions that are not useful right now.',
				],
				tips: [
					'Recommendations improve as the underlying records improve.',
					'Use the suggestion as a starting point, not a final conclusion.',
				],
			},
		],
	},
	{
		slug: 'work-with-family-and-team-members',
		title: 'Work with family and team members',
		summary:
			'Share responsibility while keeping access, assignments, and dashboard focus clear.',
		readTime: '5 min read',
		path: '/profile',
		actionLabel: 'Open Your Profile',
		introduction:
			'Shared access helps family members and team members contribute to the property record without everyone needing the same responsibilities.',
		founderNote: [
			'Property knowledge often lives with more than one person.',
			'Maintley should make that collaboration easier while keeping property access, task ownership, and completed work clear.',
		],
		sections: [
			{
				heading: 'What this helps you do',
				paragraphs: [
					'Family members and team members can help manage work based on the access and properties assigned to them. Team members operate within assigned-property scope and do not own billing.',
					'Dashboard focus can help each person see work that is relevant to them while still allowing broader all-work views when appropriate.',
				],
			},
			{
				heading: 'How to set up shared work',
				steps: [
					'Invite the person using the relationship that matches their responsibility.',
					'Assign only the properties they need.',
					'Assign tasks when they own the next action.',
					'Record completed work in Maintley instead of leaving it only in messages or email.',
				],
			},
			{
				heading: 'How dashboard focus helps',
				paragraphs: [
					'A personal dashboard view can reduce noise for someone who only needs assigned work or a limited property set. Owners and managers can switch to a broader view when they need portfolio context.',
				],
				image: {
					src: '/screenshots/desktop_dashboard.png',
					alt: 'Dashboard focus controls showing personal and all-work views.',
					caption:
						'Dashboard focus helps each user start with the work most relevant to them.',
				},
				tips: [
					'Use clear task titles and due dates.',
					'Keep access limited to relevant properties.',
					'Record decisions and completed work where the team can find them.',
				],
			},
		],
	},
	{
		slug: 'prepare-property-records-for-a-contractor',
		title: 'Prepare property records for a contractor',
		summary:
			'Gather equipment details, service history, photos, documents, and questions before a visit.',
		readTime: '5 min read',
		path: '/properties',
		actionLabel: 'Choose a Property',
		introduction:
			'A prepared property record helps a contractor understand the equipment, symptoms, previous work, and available documents before or during a service visit.',
		founderNote: [
			'Contractor conversations are easier when you can answer basic questions without searching through old messages.',
			'Maintley keeps the model details, service history, current task, photos, and documents connected to the property record.',
		],
		sections: [
			{
				heading: 'What to prepare',
				steps: [
					'Confirm the property and equipment location.',
					'Verify manufacturer, model, serial number, and install date when known.',
					'Attach manuals, warranties, previous service reports, photos, or error codes.',
					'Review Maintenance History for past repairs and recurring issues.',
				],
				image: {
					src: '/screenshots/desktop_propertydetails.png',
					alt: 'Property or system record prepared with details for a contractor visit.',
					caption:
						'Prepare the equipment details, files, and service history before a contractor visit.',
				},
			},
			{
				heading: 'How to describe the issue',
				paragraphs: [
					'Record observable symptoms, when they started, and any conditions that affect them. Avoid presenting an unverified diagnosis as fact.',
					'Photos, videos, error codes, measurements, and exact dates can be more useful than a broad description.',
				],
			},
			{
				heading: 'What to do after the visit',
				paragraphs: [
					'Record the contractor findings, completed work, cost, replaced parts, warranty coverage, and recommended follow-up. Attach the final invoice and service report.',
				],
				tips: [
					'Keep access instructions separate from technical notes.',
					'Ask for exact part names or numbers.',
					'Create a task for recommended follow-up work.',
				],
			},
		],
	},
	{
		slug: 'repair-record-or-maintenance-task',
		title: 'Choose between a task and a maintenance record',
		summary:
			'Choose tasks for future work and Maintenance History for completed work.',
		readTime: '4 min read',
		path: '/tasks',
		actionLabel: 'Go to Tasks',
		introduction:
			'Use a task for work that still needs attention. Use Maintenance History for work that already happened.',
		founderNote: [
			'A to-do list and a property history answer different questions.',
			'Maintley connects them, but the distinction keeps the record easier to understand.',
		],
		sections: [
			{
				heading: 'Use a task when work is pending',
				paragraphs: [
					'Create a task for inspections, repairs, replacements, recurring maintenance, or follow-up work that still needs to happen.',
					'Tasks can have due dates, recurrence, reminders, assignments, notes, and property or system links.',
				],
			},
			{
				heading: 'Use Maintenance History for completed work',
				paragraphs: [
					'Create a maintenance record when the work already happened and there was no Maintley task to complete. Record the actual service date, work performed, contractor, cost, notes, and supporting files when known.',
				],
			},
			{
				heading: 'Complete a task when one already exists',
				paragraphs: [
					'If the work started as a Maintley task, complete that task instead of creating an unrelated duplicate history entry.',
				],
				image: {
					src: '/screenshots/desktop_taskhistory.png',
					alt: 'Task completion screen or Maintenance History record for completed work.',
					caption:
						'Completing the task keeps the planned work and historical record connected.',
				},
				tips: [
					'Future action equals task.',
					'Past verified work equals Maintenance History.',
					'Completed Maintley task equals task completion with historical details.',
				],
			},
		],
	},
	{
		slug: 'what-to-preserve-after-service-work',
		title: 'Preserve service work after the visit',
		summary:
			'Record the service details that matter for future repairs, warranty claims, and property history.',
		readTime: '5 min read',
		path: '/properties',
		actionLabel: 'Choose a Property',
		introduction:
			'After service work, preserve enough information to understand what happened without relying on memory, email, or the contractor being available later.',
		founderNote: [
			'The few minutes after service work are often the best time to capture useful details.',
			'Maintley turns that small follow-up habit into a record that can stay useful for years.',
		],
		sections: [
			{
				heading: 'What to record',
				steps: [
					'The actual service date.',
					'The contractor or person who performed the work.',
					'The reported problem and verified findings.',
					'The work completed and parts replaced.',
					'The total cost and any warranty coverage.',
				],
			},
			{
				heading: 'Where to save it',
				paragraphs: [
					'Save completed work in Maintenance History or by completing the related task. Link the record to the correct property and appliance or system whenever possible.',
				],
				image: {
					src: '/screenshots/desktop_taskhistory.png',
					alt: 'Maintenance History showing a completed service record with supporting details.',
					caption:
						'Maintenance History preserves what happened, when it happened, and what records support it.',
				},
			},
			{
				heading: 'What to attach',
				paragraphs: [
					'Attach the final invoice, service report, receipts, photos, and warranty information. These files support the maintenance record and make future repairs easier to understand.',
				],
				tips: [
					'Ask for exact part names or numbers.',
					'Record measurements and settings that may matter later.',
					'Separate verified findings from recommendations.',
				],
			},
		],
	},
];

export const getHelpfulArticle = (slug?: string) =>
	helpfulArticles.find((article) => article.slug === slug);
