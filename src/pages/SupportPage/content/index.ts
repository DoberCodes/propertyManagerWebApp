import { supportArticles } from './articles';
import { getArticleReadTime } from './readTime';
import type { HelpfulArticleWithReadTime } from './types';

export type { ArticleSection, HelpfulArticle, HelpfulArticleWithReadTime } from './types';
export { getArticleReadTime, getArticleWordCount } from './readTime';

export const helpfulArticles: HelpfulArticleWithReadTime[] = supportArticles.map(
	(article) => ({ ...article, readTime: getArticleReadTime(article) }),
);

export const getHelpfulArticle = (slug?: string) =>
	helpfulArticles.find((article) => article.slug === slug);

export const getRelatedHelpfulArticles = (slug?: string) => {
	const article = getHelpfulArticle(slug);
	return (article?.relatedGuideSlugs || [])
		.map((relatedSlug) => getHelpfulArticle(relatedSlug))
		.filter((related): related is HelpfulArticleWithReadTime => Boolean(related));
};
