import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faArrowRight,
	faBookOpen,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { helpfulArticles } from './SupportContent';
import {
	ArticleArrow,
	ArticleBackButton,
	ArticleCard,
	ArticleDescription,
	ArticleGrid,
	ArticleHero,
	ArticleIcon,
	ArticleLibraryHeader,
	ArticlePageIntro,
	ArticlePageMeta,
	ArticlePageShell,
	ArticlePageTitle,
	ArticleReadTime,
	ArticleSummary,
	ArticleSummaryCopy,
	ArticleTitle,
} from './SupportPage.styles';

export const SupportArticlesPage: React.FC = () => {
	const navigate = useNavigate();

	return (
		<ArticlePageShell>
			<ArticleBackButton
				type='button'
				onClick={() => navigate('/support?view=help')}>
				<FontAwesomeIcon icon={faArrowLeft} />
				Back to Guides & FAQs
			</ArticleBackButton>

			<ArticleHero>
				<ArticlePageMeta>
					<FontAwesomeIcon icon={faBookOpen} />
					Maintley Guides
				</ArticlePageMeta>
				<ArticlePageTitle>Maintley Guides</ArticlePageTitle>
				<ArticlePageIntro>
					Step-by-step guidance for building useful property records, keeping
					maintenance visible, and getting more value from Maintley.
				</ArticlePageIntro>
			</ArticleHero>

			<ArticleLibraryHeader>
				<div>
					<h2 style={{ margin: '18px 0 5px' }}>All guides</h2>
					<p style={{ margin: 0, color: '#6b7280' }}>
						{helpfulArticles.length} guides available
					</p>
				</div>
			</ArticleLibraryHeader>

			<ArticleGrid>
				{helpfulArticles.map((article) => (
					<ArticleCard
						key={article.slug}
						type='button'
						onClick={() => navigate(`/support/articles/${article.slug}`)}>
						<ArticleSummary>
							<ArticleIcon>
								<FontAwesomeIcon icon={faBookOpen} />
							</ArticleIcon>
							<ArticleSummaryCopy>
								<ArticleTitle>{article.title}</ArticleTitle>
								<ArticleDescription>{article.summary}</ArticleDescription>
								<ArticleReadTime>
									Maintley Guide - {article.readTime}
								</ArticleReadTime>
							</ArticleSummaryCopy>
							<ArticleArrow>
								<FontAwesomeIcon icon={faArrowRight} />
							</ArticleArrow>
						</ArticleSummary>
					</ArticleCard>
				))}
			</ArticleGrid>
		</ArticlePageShell>
	);
};
