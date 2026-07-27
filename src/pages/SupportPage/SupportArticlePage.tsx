import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faArrowRight,
	faBookOpen,
	faLightbulb,
	faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
	getHelpfulArticle,
	getRelatedHelpfulArticles,
} from './SupportContent';
import {
	ArticleBackButton,
	ArticleFooter,
	ArticleCard,
	ArticleDescription,
	ArticleGrid,
	ArticleHero,
	ArticlePageContent,
	ArticlePageIntro,
	ArticlePageMeta,
	ArticlePageShell,
	ArticlePageTitle,
	ArticlePrimaryAction,
	ArticleSection,
	ArticleSummary,
	ArticleSummaryCopy,
	ArticleTitle,
	ArticleSectionImage,
	ArticleTips,
	EmptyState,
	FounderNote,
	FounderNoteIcon,
	FounderNoteLabel,
	FounderNoteText,
	FounderSignature,
} from './SupportPage.styles';

export const SupportArticlePage: React.FC = () => {
	const navigate = useNavigate();
	const { articleSlug } = useParams<{ articleSlug: string }>();
	const article = getHelpfulArticle(articleSlug);
	const relatedArticles = getRelatedHelpfulArticles(articleSlug);

	if (!article) {
		return (
			<ArticlePageShell>
				<ArticleBackButton
					type='button'
					onClick={() => navigate('/support/articles')}>
					<FontAwesomeIcon icon={faArrowLeft} />
					Back to all guides
				</ArticleBackButton>
				<EmptyState>
					<FontAwesomeIcon icon={faBookOpen} />
					<h3>Guide not found</h3>
					<p>This Maintley Guide may have moved or is no longer available.</p>
				</EmptyState>
			</ArticlePageShell>
		);
	}

	return (
		<ArticlePageShell>
			<ArticleBackButton
				type='button'
				onClick={() => navigate('/support/articles')}>
				<FontAwesomeIcon icon={faArrowLeft} />
				Back to all guides
			</ArticleBackButton>

			<ArticleHero>
				<ArticlePageMeta>
					<FontAwesomeIcon icon={faBookOpen} />
					Maintley Guide - {article.readTime}
				</ArticlePageMeta>
				<ArticlePageTitle>{article.title}</ArticlePageTitle>
				<ArticlePageIntro>{article.introduction}</ArticlePageIntro>
			</ArticleHero>

			<ArticlePageContent>
				{article.founderNote?.length ? (
					<FounderNote>
						<FounderNoteIcon>
							<FontAwesomeIcon icon={faQuoteLeft} />
						</FounderNoteIcon>
						<FounderNoteLabel>Why this matters</FounderNoteLabel>
						{article.founderNote.map((paragraph) => (
							<FounderNoteText key={paragraph}>{paragraph}</FounderNoteText>
						))}
						<FounderSignature>Austin, Founder of Maintley</FounderSignature>
					</FounderNote>
				) : null}

				{article.sections.map((section) => (
					<ArticleSection key={section.heading}>
						<h2>{section.heading}</h2>
						{section.paragraphs?.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
						{section.steps?.length ? (
							<ol>
								{section.steps.map((step) => (
									<li key={step}>{step}</li>
								))}
							</ol>
						) : null}
						{section.image?.src ? (
							<ArticleSectionImage>
								<img src={section.image.src} alt={section.image.alt} loading='lazy' />
								{section.image.caption ? (
									<figcaption>{section.image.caption}</figcaption>
								) : null}
							</ArticleSectionImage>
						) : null}
						{section.tips?.length ? (
							<ArticleTips>
								<strong>
									<FontAwesomeIcon icon={faLightbulb} /> Guide tips
								</strong>
								<ul>
									{section.tips.map((tip) => (
										<li key={tip}>{tip}</li>
									))}
								</ul>
							</ArticleTips>
						) : null}
					</ArticleSection>
				))}

				{relatedArticles.length ? (
					<ArticleSection>
						<h2>Related guides</h2>
						<ArticleGrid>
							{relatedArticles.map((relatedArticle) => (
								<ArticleCard
									key={relatedArticle.slug}
									type='button'
									onClick={() => navigate(`/support/articles/${relatedArticle.slug}`)}>
									<ArticleSummary>
										<ArticleSummaryCopy>
											<ArticleTitle>{relatedArticle.title}</ArticleTitle>
											<ArticleDescription>{relatedArticle.summary}</ArticleDescription>
										</ArticleSummaryCopy>
										<FontAwesomeIcon icon={faArrowRight} />
									</ArticleSummary>
								</ArticleCard>
							))}
						</ArticleGrid>
					</ArticleSection>
				) : null}
			</ArticlePageContent>

			<ArticleFooter>
				<div>
					<h2>Ready to put this guide into practice?</h2>
					<p>Open the relevant area in Maintley and continue from there.</p>
				</div>
				<ArticlePrimaryAction
					type='button'
					onClick={() => navigate(article.path)}>
					{article.actionLabel}
					<FontAwesomeIcon icon={faArrowRight} />
				</ArticlePrimaryAction>
			</ArticleFooter>
		</ArticlePageShell>
	);
};
