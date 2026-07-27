import { helpfulArticles } from '.';
import { getArticleReadTime, getArticleWordCount } from './readTime';

const deepGuideSlugs = [
	'build-a-useful-property-record',
	'how-tasks-become-maintenance-history',
	'track-appliances-and-home-systems',
	'review-document-suggestions',
	'use-maintley-intelligence-recommendations',
	'work-with-family-and-team-members',
];

describe('support article library', () => {
	it('contains 20 uniquely addressable guides', () => {
		expect(helpfulArticles).toHaveLength(20);
		expect(new Set(helpfulArticles.map((article) => article.slug)).size).toBe(20);
	});

	it('keeps every related guide reference valid', () => {
		const slugs = new Set(helpfulArticles.map((article) => article.slug));

		for (const article of helpfulArticles) {
			for (const relatedSlug of article.relatedGuideSlugs || []) {
				expect(relatedSlug).not.toBe(article.slug);
				expect(slugs.has(relatedSlug)).toBe(true);
			}
		}
	});

	it.each(deepGuideSlugs)('%s contains 600 to 900 words', (slug) => {
		const article = helpfulArticles.find((candidate) => candidate.slug === slug);
		expect(article).toBeDefined();
		const wordCount = getArticleWordCount(article!);
		expect(wordCount).toBeGreaterThanOrEqual(600);
		expect(wordCount).toBeLessThanOrEqual(900);
	});

	it('derives read time from visible article text', () => {
		for (const article of helpfulArticles) {
			expect(article.readTime).toBe(getArticleReadTime(article));
			expect(article.readTime).toMatch(/^\d+ min read$/);
		}
	});
});
