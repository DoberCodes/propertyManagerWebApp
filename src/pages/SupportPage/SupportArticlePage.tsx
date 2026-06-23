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
import { getHelpfulArticle } from './SupportContent';
import {
	ArticleBackButton,
	ArticleFooter,
	ArticleHero,
	ArticlePageContent,
	ArticlePageIntro,
	ArticlePageMeta,
	ArticlePageShell,
	ArticlePageTitle,
	ArticlePrimaryAction,
	ArticleSection,
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

	if (!article) {
		return (
			<ArticlePageShell>
				<ArticleBackButton
					type='button'
					onClick={() => navigate('/support/articles')}>
					<FontAwesomeIcon icon={faArrowLeft} />
					Back to all articles
				</ArticleBackButton>
				<EmptyState>
					<FontAwesomeIcon icon={faBookOpen} />
					<h3>Article not found</h3>
					<p>This help article may have moved or is no longer available.</p>
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
				Back to all articles
			</ArticleBackButton>

			<ArticleHero>
				<ArticlePageMeta>
					<FontAwesomeIcon icon={faBookOpen} />
					Helpful article · {article.readTime}
				</ArticlePageMeta>
				<ArticlePageTitle>{article.title}</ArticlePageTitle>
				<ArticlePageIntro>{article.introduction}</ArticlePageIntro>
			</ArticleHero>

			<ArticlePageContent>
				<FounderNote>
					<FounderNoteIcon>
						<FontAwesomeIcon icon={faQuoteLeft} />
					</FounderNoteIcon>
					<FounderNoteLabel>From the founder</FounderNoteLabel>
					{article.founderNote.map((paragraph) => (
						<FounderNoteText key={paragraph}>{paragraph}</FounderNoteText>
					))}
					<FounderSignature>— Austin, Founder of Maintley</FounderSignature>
				</FounderNote>

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
						{section.tips?.length ? (
							<ArticleTips>
								<strong>
									<FontAwesomeIcon icon={faLightbulb} /> Helpful tips
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
			</ArticlePageContent>

			<ArticleFooter>
				<div>
					<h2>Ready to put this into practice?</h2>
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
