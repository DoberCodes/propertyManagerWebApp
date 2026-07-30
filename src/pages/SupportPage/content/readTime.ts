import type { HelpfulArticle } from './types';

export const SUPPORT_READING_WORDS_PER_MINUTE = 225;

const countWords = (value: string): number =>
	value.trim() ? value.trim().split(/\s+/u).length : 0;

export const getArticleWordCount = (article: HelpfulArticle): number => {
	const text = [
		article.title,
		article.summary,
		article.introduction,
		...(article.founderNote || []),
		...article.sections.flatMap((section) => [
			section.heading,
			...(section.paragraphs || []),
			...(section.steps || []),
			...(section.tips || []),
			section.image?.caption || '',
		]),
	].join(' ');

	return countWords(text);
};

export const getArticleReadTime = (article: HelpfulArticle): string => {
	const minutes = Math.max(
		1,
		Math.ceil(getArticleWordCount(article) / SUPPORT_READING_WORDS_PER_MINUTE),
	);
	return `${minutes} min read`;
};
