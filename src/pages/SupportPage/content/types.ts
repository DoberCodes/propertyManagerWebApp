export interface ArticleImage {
	src: string;
	alt: string;
	caption?: string;
}

export interface ArticleSection {
	heading: string;
	paragraphs?: string[];
	steps?: string[];
	tips?: string[];
	image?: ArticleImage;
}

export interface HelpfulArticle {
	slug: string;
	title: string;
	summary: string;
	path: string;
	actionLabel: string;
	introduction: string;
	founderNote?: string[];
	sections: ArticleSection[];
	relatedGuideSlugs?: string[];
}

export interface HelpfulArticleWithReadTime extends HelpfulArticle {
	readTime: string;
}
