import React, { useEffect } from 'react';

export type SEOProps = {
	title?: string;
	description?: string;
	url?: string;
	image?: string;
	keywords?: string;
	noindex?: boolean;
	structuredData?: object | null;
};

// Small, dependency-free head manager for SPA pages. It updates common
// meta tags (description, keywords), Open Graph / Twitter tags and
// injects JSON-LD structured data when provided.
export const SEO: React.FC<SEOProps> = ({
	title,
	description,
	url,
	image,
	keywords,
	noindex,
	structuredData,
}) => {
	useEffect(() => {
		const prevTitle = document.title;

		if (title) document.title = title;

		const setMeta = (selector: string, attr: string, value?: string) => {
			if (!value && value !== '') return;
			let el = document.head.querySelector(selector) as HTMLMetaElement | null;
			if (!el) {
				el = document.createElement('meta');
				const parts = selector.match(/\[([^=]+)="([^"]+)"\]/);
				if (parts && parts.length === 3) {
					el.setAttribute(parts[1], parts[2]);
				}
				document.head.appendChild(el);
			}
			el.setAttribute(attr, value || '');
		};

		// Basic tags
		setMeta(
			'meta[name="description"]',
			'content',
			description || 'Maintley — property & maintenance history made simple',
		);
		if (keywords) setMeta('meta[name="keywords"]', 'content', keywords);

		// Open Graph
		setMeta('meta[property="og:type"]', 'content', 'website');
		if (title) setMeta('meta[property="og:title"]', 'content', title);
		if (description)
			setMeta('meta[property="og:description"]', 'content', description);
		if (url) setMeta('meta[property="og:url"]', 'content', url);
		if (image) setMeta('meta[property="og:image"]', 'content', image);

		// Twitter
		setMeta(
			'meta[name="twitter:card"]',
			'content',
			image ? 'summary_large_image' : 'summary',
		);
		if (title) setMeta('meta[name="twitter:title"]', 'content', title);
		if (description)
			setMeta('meta[name="twitter:description"]', 'content', description);
		if (image) setMeta('meta[name="twitter:image"]', 'content', image);

		// canonical link
		if (url) {
			let link: HTMLLinkElement | null = document.head.querySelector(
				'link[rel="canonical"]',
			);
			if (!link) {
				link = document.createElement('link');
				link.setAttribute('rel', 'canonical');
				document.head.appendChild(link);
			}
			link.setAttribute('href', url);
		}

		// robots
		if (noindex) {
			setMeta('meta[name="robots"]', 'content', 'noindex');
		} else {
			setMeta('meta[name="robots"]', 'content', 'index, follow');
		}

		// JSON-LD structured data
		let jsonLdEl: HTMLScriptElement | null = null;
		if (structuredData) {
			jsonLdEl = document.createElement('script');
			jsonLdEl.type = 'application/ld+json';
			jsonLdEl.text = JSON.stringify(structuredData);
			document.head.appendChild(jsonLdEl);
		}

		return () => {
			// cleanup: restore previous title and remove injected JSON-LD
			document.title = prevTitle;
			if (jsonLdEl && jsonLdEl.parentNode)
				jsonLdEl.parentNode.removeChild(jsonLdEl);
		};
	}, [title, description, url, image, keywords, noindex, structuredData]);

	return null;
};

export default SEO;
