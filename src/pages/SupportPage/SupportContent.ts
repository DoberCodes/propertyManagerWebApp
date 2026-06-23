export const supportFaqItems = [
	{
		question: 'How do I report a problem or request a feature?',
		answer:
			'Select New support request, choose the request type, and include what happened or what you would like Maintley to do. Screenshots are helpful when something is not working correctly.',
	},
	{
		question: 'Where can I check the status of my request?',
		answer:
			'Open My requests in the Support Center to review open and closed requests and the latest Maintley update.',
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
];

export const supportKnownIssues = [
	'Ad or privacy blockers may interfere with support request submission.',
	'If mobile notifications are not arriving, review both device permissions and Maintley notification settings.',
	'Changes may take a moment to appear when the device has an unstable connection.',
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
		version: '2.5.9',
		date: 'June 20, 2026',
		type: 'Feature',
		title: 'Customizable property groups',
		description:
			'Create, reorder, rename, customize, move, and remove property groups from a more focused management experience.',
	},
	{
		version: '2.5.1',
		date: 'June 18, 2026',
		type: 'Major update',
		title: 'Mobile bottom navigation and Quick Create',
		description:
			'Core destinations and common create actions are now easier to reach while working from a phone or tablet.',
	},
	{
		version: '2.5.0',
		date: 'June 18, 2026',
		type: 'Feature',
		title: 'Customer support ticket tracking',
		description:
			'Support requests now include ticket numbers, customer-visible status updates, attachments, and improved follow-up.',
	},
];

interface ArticleSection {
	heading: string;
	paragraphs?: string[];
	steps?: string[];
	tips?: string[];
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
			'Start with the basics, then add appliances, tasks, documents, and history over time.',
		readTime: '5 min read',
		path: '/properties',
		actionLabel: 'Go to Properties',
		introduction:
			'A useful property record brings together the facts about a real property: its address, equipment, upcoming work, completed maintenance, and supporting documents.',
		founderNote: [
			'One of the reasons I started building Maintley was that property information has a way of disappearing into ordinary life. A filter size gets written on a scrap of paper. A service invoice lives in an email. Someone remembers when the water heater was installed, right up until they do not.',
			'I do not think you should spend an entire weekend documenting your property before the app becomes useful. My approach is to start with the things I would be frustrated to lose, then let the record grow naturally whenever maintenance happens.',
		],
		sections: [
			{
				heading: 'Record the actual property',
				paragraphs: [
					'Enter the property’s real street address and factual property details. If Maintley provides a separate display-name field, use it only as a recognizable label such as “Main Street Rental” or “Lake House”; it does not replace the address.',
					'The property record becomes the main location for its appliances, tasks, documents, contractors, and maintenance history.',
					'If some details are unknown, leave them blank rather than estimating. Add verified information when it becomes available through records, equipment labels, contractors, or completed work.',
				],
			},
			{
				heading: 'Focus on equipment you will maintain',
				paragraphs: [
					'Start with equipment that has recurring maintenance, identifying information you may need later, significant replacement cost, or an existing service history.',
					'Heating and cooling equipment, water heaters, roofing, generators, pumps, and major appliances are usually good candidates. Even a basic profile with a name and location gives future tasks and documents somewhere useful to live.',
				],
				steps: [
					'Take a photo of the model and serial label while you are standing near the equipment.',
					'Add the manufacturer, model, install date, filter size, or commonly used parts when known.',
					'Attach the manual or warranty to the equipment profile instead of keeping it in a general folder.',
				],
			},
			{
				heading: 'Let normal maintenance build the history',
				paragraphs: [
					'The record becomes most valuable when it grows as a side effect of doing the work. Use a task for something that still needs attention. When the work is finished, record what happened while the details are still fresh.',
					'A sentence or two can be enough: who performed the work, what they found, what part was replaced, and what it cost. Add the invoice or a photo if it would help you understand the work later.',
					'Over time, those entries create a dated maintenance record. You no longer need to guess whether the water heater was flushed last spring or three years ago because the completion date and service details are recorded.',
				],
				tips: [
					'Use names another person in your household or team would understand.',
					'Record completed work before the invoice disappears into your inbox.',
					'Attach documents to the most specific relevant property, appliance, or maintenance entry.',
				],
			},
			{
				heading: 'A useful record is never really finished',
				paragraphs: [
					'Maintley is designed as a property record that improves over time, not a setup project that must be completed once. Every task, service note, photo, and document adds useful context.',
					'If you only add information when it is useful, the record stays practical. That is much better than creating a large amount of data that nobody wants to maintain.',
				],
			},
		],
	},
	{
		slug: 'how-tasks-become-maintenance-history',
		title: 'How tasks become maintenance history',
		summary:
			'Understand the connection between planned work, completed work, and the long-term property record.',
		readTime: '5 min read',
		path: '/tasks',
		actionLabel: 'Go to Tasks',
		introduction:
			'Tasks and Maintenance History serve two different purposes. A task is a plan or reminder. Maintenance History is the record of what actually happened. Completing a task is how those two ideas meet.',
		founderNote: [
			'I have found that a checklist alone is not enough for property maintenance. Checking off “service furnace” may feel good today, but a year from now it does not tell you who serviced it, what they found, or whether a part was replaced.',
			'That is why I want task completion in Maintley to feel less like clearing an item from a list and more like preserving a small piece of the property’s story.',
		],
		sections: [
			{
				heading: 'Use tasks for work that still needs to happen',
				paragraphs: [
					'Create a task when something needs attention: a repair, inspection, replacement, seasonal check, or recurring maintenance item. The title should describe the action clearly enough that you know what to do without opening it.',
					'Link the correct property and appliance or system whenever possible. That connection is important because it determines where the completed work will make sense later.',
				],
				steps: [
					'Prefer “Replace upstairs HVAC filter” over “HVAC.”',
					'Add a realistic due date and priority.',
					'Assign the task when someone else owns the next action.',
					'Use reminders or recurrence for work that should not depend on memory.',
				],
			},
			{
				heading: 'Record the result, not just the checkbox',
				paragraphs: [
					'When the work is finished, take a moment to record the result. You do not need to write a formal report. A plain explanation of what was done is usually the most useful.',
					'For a simple task, that may be “Replaced 16x25x1 filter with MERV 8.” For a larger repair, include the contractor, diagnosis, replaced parts, cost, and any follow-up recommendation.',
					'Service notes, costs, logs, photos, invoices, and other files become supporting context. Completed work then appears in Maintenance History for the property and, when linked, the appliance or system.',
				],
				tips: [
					'Write what changed or what was discovered.',
					'Include measurements, part numbers, and contractor details when they may matter later.',
					'Attach the invoice or service report while you still know which task it belongs to.',
				],
			},
			{
				heading: 'Why this becomes valuable later',
				paragraphs: [
					'After enough work is recorded, Maintenance History becomes more than a completed-task archive. It helps you spot recurring problems, understand replacement timing, answer contractor questions, and explain the property to someone else.',
					'That long-term record is one of the most important ideas behind Maintley. The task gets you through today. The history helps you make better decisions tomorrow.',
				],
			},
		],
	},
	{
		slug: 'track-appliances-and-home-systems',
		title: 'Track appliances and home systems',
		summary:
			'Keep model information, parts, documents, tasks, and service history connected.',
		readTime: '5 min read',
		path: '/devices',
		actionLabel: 'Go to Appliances',
		introduction:
			'Appliance and system profiles keep the details, documents, parts, tasks, and service history for important equipment in one understandable place.',
		founderNote: [
			'I have stood in front of equipment trying to read a faded model label while searching old emails for the last service visit. That experience is exactly what these profiles are meant to avoid.',
			'My rule is simple: if an item is expensive, needs recurring care, has a model number you may need, or has a history worth preserving, it probably deserves a profile.',
		],
		sections: [
			{
				heading: 'Choose equipment that is worth remembering',
				paragraphs: [
					'Start with the systems that would cause the most frustration if their information disappeared. Heating and cooling equipment, water heaters, generators, pumps, safety equipment, roofing, and major appliances are common examples.',
					'The profile can be minimal. A name, property, and location are enough to begin. Add deeper details when you are near the equipment or when service work gives you new information.',
				],
				steps: [
					'Heating and cooling equipment',
					'Water heaters and water treatment systems',
					'Kitchen and laundry appliances',
					'Roofing, generators, pumps, safety equipment, and other systems',
				],
			},
			{
				heading: 'Capture identification details once',
				paragraphs: [
					'Manufacturer, model, serial number, install date, and location are tedious to look up repeatedly. Recording them once makes ordering parts, checking warranty coverage, and speaking with a contractor much easier.',
					'Take a clear photo of the equipment label when possible. It preserves the source information and provides a reference if a model or serial number is entered incorrectly.',
				],
			},
			{
				heading: 'Build the equipment’s service record',
				paragraphs: [
					'Keep filters, parts, manuals, warranties, receipts, photos, and logs connected to the equipment. Link maintenance tasks before completing them so the resulting history appears where you would naturally look for it.',
					'Over time, the profile should answer what the equipment is, what it needs, what has gone wrong, and what has already been done about it.',
				],
				tips: [
					'Photograph the model and serial label.',
					'Record filter sizes and commonly replaced parts.',
					'Link maintenance tasks to the appliance before completing them.',
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
			'Property documents are useful when you can find them at the moment they matter. The goal is not merely to upload files—it is to keep each file connected to the property, appliance, or maintenance activity it explains.',
		founderNote: [
			'I have never found “put everything in one giant folder” to be a satisfying long-term system. It works until you need a specific warranty, invoice, or service report and cannot remember what it was called.',
			'In Maintley, I prefer putting a document near the thing it describes. That little bit of context does most of the organizational work for you.',
		],
		sections: [
			{
				heading: 'Choose the right location',
				paragraphs: [
					'Before uploading a file, ask what record you would be viewing when you need it again. That is usually where the file belongs.',
				],
				steps: [
					'Use the property for broad records such as inspections or general photos.',
					'Use the appliance profile for manuals, warranties, labels, or equipment receipts.',
					'Use the maintenance completion for invoices, service reports, and work photos.',
				],
			},
			{
				heading: 'Use clear, factual file names',
				paragraphs: [
					'Camera and scanner filenames are rarely meaningful. Rename the file using the equipment, document type, contractor, or date when that context will help. “Water Heater Warranty - 2025” is far easier to recognize than “IMG_1042.”',
					'You do not need an elaborate naming convention. The name only needs to make sense when you encounter it months or years later.',
				],
			},
			{
				heading: 'Use photos and documents intentionally',
				paragraphs: [
					'Photos are excellent for labels, damage, installation details, and before-and-after reference. Documents are better for manuals, warranties, invoices, receipts, inspection reports, and formal service records.',
					'Both support the property record, but neither replaces a maintenance entry explaining what work was completed. A receipt proves a purchase; the history explains why it mattered.',
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
		slug: 'set-up-maintenance-reminders',
		title: 'Set up useful maintenance reminders',
		summary:
			'Choose the notifications you want and control reminders for individual tasks.',
		readTime: '4 min read',
		path: '/settings?category=notifications',
		actionLabel: 'Open Notification Settings',
		introduction:
			'Notifications are most helpful when they quietly bring the right work back to your attention. They should support your maintenance habits without turning every task into background noise.',
		founderNote: [
			'I do not want Maintley to nag people. I want a reminder to arrive early enough that you can plan the work, then become more direct only when the due date is close or has passed.',
			'The best reminder system is the one you still trust. That usually means enabling reminders for meaningful tasks, using realistic due dates, and turning off channels you consistently ignore.',
		],
		sections: [
			{
				heading: 'Choose your notification channels',
				paragraphs: [
					'Notification Settings control in-app, push, and email preferences. Think about where you are most likely to act. Push notifications are useful for timely reminders, while email can be better for summaries and information you want to revisit.',
					'Some options depend on the account plan or device permissions. Even when Maintley is configured correctly, a phone or browser can still block push notifications.',
				],
			},
			{
				heading: 'Enable reminders for tasks',
				paragraphs: [
					'Reminders can be enabled for individual tasks or in bulk. When a task does not already have a custom schedule, Maintley can assign the default schedule below.',
					'The default schedule provides advance notice, a due-date reminder, and an overdue follow-up without requiring a custom schedule for every task.',
				],
				steps: [
					'30 days before the due date',
					'7 days before the due date',
					'On the due date',
					'1 week after the due date when still incomplete',
				],
			},
			{
				heading: 'Troubleshoot missing notifications',
				paragraphs: [
					'When a reminder does not arrive, work from the task outward. First confirm that the task has a due date and notifications enabled, then check account preferences and device permissions.',
				],
				steps: [
					'Confirm the task has notifications enabled and a due date.',
					'Review Maintley notification preferences.',
					'Check the phone or browser notification permission.',
					'Confirm the device has a stable connection and current app version.',
				],
				tips: [
					'Complete or reschedule stale tasks so overdue reminders stay meaningful.',
					'Use custom schedules for work that needs more or less lead time than the default.',
				],
			},
		],
	},
	{
		slug: 'organize-properties-with-groups',
		title: 'Organize multiple properties with groups',
		summary:
			'Create a clearer portfolio without changing who owns each property.',
		readTime: '4 min read',
		path: '/properties',
		actionLabel: 'Manage Property Groups',
		introduction:
			'Groups provide a visual way to organize properties by portfolio, region, property type, or another practical category. They are meant to make a long Properties page easier to understand at a glance.',
		founderNote: [
			'I wanted groups to feel more like arranging folders on a desk than configuring another complicated account structure. They should help you find and scan properties—not introduce a second ownership system.',
			'My preference is to use the fewest groups that make the portfolio clearer. A handful of meaningful categories usually works better than a perfectly detailed hierarchy.',
		],
		sections: [
			{
				heading: 'Create a practical group structure',
				paragraphs: [
					'Choose categories that describe a real distinction in the portfolio, such as Personal and Rentals, geographic regions, ownership portfolios, or property types.',
					'Avoid creating a group for information that already belongs in the property record. Groups are strongest when each property has an obvious home and the names remain easy to scan.',
				],
			},
			{
				heading: 'Make groups recognizable',
				paragraphs: [
					'Icons and colors are there to make groups easier to identify, especially on a phone. Use them consistently rather than trying to make every group visually unique.',
					'You can also choose whether a group starts collapsed and drag groups into the order that matches how often you use them.',
				],
				steps: [
					'Choose a clear group name and optional description.',
					'Select an icon and color for quick recognition.',
					'Choose whether the group starts collapsed.',
					'Drag groups into your preferred order.',
				],
			},
			{
				heading: 'Move properties safely',
				paragraphs: [
					'Organization changes. A property may move from a development group into a rental portfolio, or an old category may no longer be useful. Move individual properties whenever needed.',
					'When removing a group, move its properties first or use the move-and-delete option. The property records themselves remain intact.',
					'Most importantly, groups do not change property ownership, account access, or team permissions. They are an organizational view, not a security boundary.',
				],
				tips: [
					'Keep group names short.',
					'Use colors and icons consistently.',
					'Prefer fewer useful groups over many nearly empty groups.',
				],
			},
		],
	},
	{
		slug: 'get-started-without-documenting-everything',
		title: 'Get started without documenting everything',
		summary:
			'Build a useful record in small pieces instead of turning setup into a weekend project.',
		readTime: '4 min read',
		path: '/dashboard',
		actionLabel: 'Return to Dashboard',
		introduction:
			'Maintley does not require a complete property inventory before it becomes useful. Begin with verified information connected to current work, then improve the record as normal maintenance happens.',
		founderNote: [
			'One thing I want to avoid is making Maintley feel like homework. Most people already have enough projects around a property; documenting the property should not become another overwhelming one.',
			'I would rather see someone accurately record one appliance, one task, and one completed service than create fifty empty records they never return to.',
		],
		sections: [
			{
				heading: 'Start with the next useful action',
				paragraphs: [
					'Begin with something that already needs attention. Add the relevant property, appliance or system, and task. This creates a useful record around real work instead of asking you to enter information without a purpose.',
				],
				steps: [
					'Add the real property and its address.',
					'Add the equipment involved in the current work.',
					'Create the task or record recently completed maintenance.',
					'Attach the document or photo already available.',
				],
			},
			{
				heading: 'Leave unknown information unknown',
				paragraphs: [
					'Do not estimate install dates, model numbers, costs, or service details. Leave an optional field blank until the information can be verified from an equipment label, invoice, contractor, or other record.',
					'An incomplete factual record is more trustworthy than a complete-looking record built from guesses.',
				],
			},
			{
				heading: 'Use maintenance as the routine',
				paragraphs: [
					'Each time work happens, add the details that became available. The property record will become more complete as a result of normal use.',
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
		title: 'Use Property Intelligence recommendations',
		summary:
			'Understand what recommendations mean and decide which improvements are useful for your property.',
		readTime: '5 min read',
		path: '/dashboard',
		actionLabel: 'Review Recommendations',
		introduction:
			'Property Intelligence uses existing Maintley records to suggest practical next steps. Recommendations are guidance based on recorded information—not an inspection, condition assessment, or property grade.',
		founderNote: [
			'I built Property Intelligence to answer a simple question: based on what is already recorded, what is the next useful thing someone could add or do?',
			'I do not want recommendations to judge a property or pressure someone into completing a checklist. They should help people notice opportunities while leaving the final decision with the person who knows the property.',
		],
		sections: [
			{
				heading: 'Read recommendations as opportunities',
				paragraphs: [
					'A recommendation may suggest adding a filter size, install date, warranty, appliance, or maintenance task. It identifies a potentially useful improvement based on current records.',
					'It does not establish that the property is unsafe, incomplete, or in poor condition.',
				],
			},
			{
				heading: 'Verify before adding information',
				paragraphs: [
					'When a recommendation asks for factual information, verify it from a reliable source. Equipment labels, manuals, invoices, warranty records, and qualified contractors are stronger sources than estimates.',
				],
			},
			{
				heading: 'Choose what is useful now',
				paragraphs: [
					'Act on recommendations that support current maintenance, preserve important information, or reduce future searching. Other recommendations can wait.',
				],
				tips: [
					'Prioritize recommendations tied to active maintenance.',
					'Dismiss or defer suggestions that are not relevant.',
					'Remember that recommendations improve as the underlying records improve.',
				],
			},
		],
	},
	{
		slug: 'work-with-family-and-team-members',
		title: 'Work with family and team members',
		summary:
			'Share responsibility while keeping property access and assignments clear.',
		readTime: '5 min read',
		path: '/profile',
		actionLabel: 'Open Your Profile',
		introduction:
			'Shared access works best when each person understands which properties they can access, which tasks they own, and where completed work should be recorded.',
		founderNote: [
			'Property knowledge often lives with more than one person. A spouse remembers the contractor, a family member handled the repair, or a team member knows what happened at a property that morning.',
			'I want Maintley to preserve those contributions without making access confusing. Collaboration should add context to the property record while keeping responsibility clear.',
		],
		sections: [
			{
				heading: 'Choose the appropriate relationship',
				paragraphs: [
					'Family members share an account-level relationship where supported. Team members operate within assigned-property access and do not own the subscription or billing.',
					'Use the relationship that matches the person’s actual responsibilities.',
				],
			},
			{
				heading: 'Assign properties and tasks clearly',
				paragraphs: [
					'Give team members access only to the properties they need. Assign tasks when one person is responsible for completing or coordinating the work.',
					'The assignee name should identify the person; internal IDs are references and should not be treated as user-facing information.',
				],
			},
			{
				heading: 'Record work where everyone can find it',
				paragraphs: [
					'When shared work is completed, record the result on the task or Maintenance History instead of leaving the details in a private message.',
				],
				tips: [
					'Use clear task titles and due dates.',
					'Keep access limited to relevant properties.',
					'Record decisions and completed work in Maintley.',
				],
			},
		],
	},
	{
		slug: 'prepare-property-records-for-a-contractor',
		title: 'Prepare property records for a contractor',
		summary:
			'Gather the equipment details, history, photos, and questions that make a service visit more productive.',
		readTime: '5 min read',
		path: '/properties',
		actionLabel: 'Choose a Property',
		introduction:
			'A prepared property record can help a contractor understand the equipment, recent symptoms, previous work, and available documentation before or during a service visit.',
		founderNote: [
			'I like the idea of walking into a contractor conversation with facts instead of trying to reconstruct everything while standing beside the equipment.',
			'Maintley should make that easier by keeping the model information, previous service, current task, photos, and documents connected to the same property record.',
		],
		sections: [
			{
				heading: 'Confirm the equipment record',
				steps: [
					'Verify the manufacturer, model, serial number, and equipment location.',
					'Add a clear photo of the equipment and identification label.',
					'Attach the relevant manual, warranty, or previous service report.',
				],
			},
			{
				heading: 'Describe the current issue factually',
				paragraphs: [
					'Record observable symptoms, when they started, and any conditions that affect them. Avoid presenting an unverified diagnosis as fact.',
					'Photos, videos, error codes, measurements, and exact dates can be more useful than a broad description.',
				],
			},
			{
				heading: 'Review previous work',
				paragraphs: [
					'Check Maintenance History for earlier repairs, replaced parts, recurring symptoms, and contractor recommendations. Prepare the questions you want answered during the visit.',
				],
				tips: [
					'Keep access instructions separate from technical notes.',
					'Record the contractor’s findings after the visit.',
					'Attach the final invoice and service report to the completed work.',
				],
			},
		],
	},
	{
		slug: 'repair-record-or-maintenance-task',
		title: 'Should this be a task or a maintenance record?',
		summary:
			'Choose the right place for future work, completed work, and historical information.',
		readTime: '4 min read',
		path: '/tasks',
		actionLabel: 'Go to Tasks',
		introduction:
			'Use a task for work that still needs to happen. Use Maintenance History for work that already happened. When a task is completed, its result should become part of the historical record.',
		founderNote: [
			'This distinction matters because a to-do list and a property history answer different questions. One tells you what is next. The other tells you what is true about the work that was completed.',
			'I want Maintley to connect those two ideas without blending them into one confusing list.',
		],
		sections: [
			{
				heading: 'Create a task for future work',
				paragraphs: [
					'Use a task when an inspection, repair, replacement, or routine maintenance item has not been completed. Add the due date, assignee, recurrence, and reminders needed to manage the work.',
				],
			},
			{
				heading: 'Create a maintenance record for past work',
				paragraphs: [
					'Use a manual maintenance entry when work was already completed and no Maintley task existed. Record the actual date, work performed, service notes, cost, contractor, and supporting files when known.',
				],
			},
			{
				heading: 'Complete an existing task',
				paragraphs: [
					'If the work began as a Maintley task, complete that task instead of creating an unrelated duplicate history entry. Add the completion details so the planned work and result remain connected.',
				],
				tips: [
					'Future action equals task.',
					'Past verified work equals maintenance record.',
					'Completed Maintley task equals task completion with historical details.',
				],
			},
		],
	},
	{
		slug: 'what-to-preserve-after-service-work',
		title: 'What to preserve after service work',
		summary:
			'Record the details that will matter during the next repair, replacement, warranty claim, or sale.',
		readTime: '5 min read',
		path: '/properties',
		actionLabel: 'Choose a Property',
		introduction:
			'After service work, preserve enough factual information to understand what happened without relying on the contractor, invoice, or your memory being available later.',
		founderNote: [
			'The few minutes after service work are often the best chance to preserve useful information. The contractor is still there, the replaced part is visible, and the details have not yet disappeared into email or paperwork.',
			'I want Maintley to make that small follow-up habit worthwhile by turning it into a record that remains useful for years.',
		],
		sections: [
			{
				heading: 'Record the essential facts',
				steps: [
					'The actual service date',
					'The contractor or person who performed the work',
					'The reported problem and verified findings',
					'The work completed and parts replaced',
					'The total cost and any warranty coverage',
				],
			},
			{
				heading: 'Preserve supporting records',
				paragraphs: [
					'Attach the final invoice, service report, receipts, photos, and warranty information. Link the work to the correct property and appliance or system.',
				],
			},
			{
				heading: 'Capture the next action',
				paragraphs: [
					'If the contractor recommends follow-up work, create a separate task with a clear due date. Do not bury future work only inside the service notes.',
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
