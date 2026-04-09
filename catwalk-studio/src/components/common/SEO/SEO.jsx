import { useEffect } from 'react';

/**
 * SEO Component for React SPA
 * Sets document title and meta tags dynamically
 */
export function SEO({
    title,
    description,
    keywords = [],
    canonicalUrl,
    ogImage,
    ogType = 'website',
    structuredData
}) {
    useEffect(() => {
        // Set document title
        document.title = title ? `${title} | Catwalk.AI` : 'Catwalk.AI';

        // Helper to set or update meta tag
        const setMetaTag = (name, content, isProperty = false) => {
            if (!content) return;
            const attr = isProperty ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        // Basic meta tags
        setMetaTag('description', description);
        if (keywords.length > 0) {
            setMetaTag('keywords', keywords.join(', '));
        }

        // Open Graph tags
        setMetaTag('og:title', title, true);
        setMetaTag('og:description', description, true);
        setMetaTag('og:type', ogType, true);
        if (ogImage) {
            setMetaTag('og:image', ogImage, true);
        }
        if (canonicalUrl) {
            setMetaTag('og:url', canonicalUrl, true);

            // Set canonical link
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', canonicalUrl);
        }

        // Twitter Card tags
        setMetaTag('twitter:card', 'summary_large_image');
        setMetaTag('twitter:title', title);
        setMetaTag('twitter:description', description);
        if (ogImage) {
            setMetaTag('twitter:image', ogImage);
        }

        // Structured Data (JSON-LD)
        if (structuredData) {
            let script = document.querySelector('script[data-seo-jsonld]');
            if (!script) {
                script = document.createElement('script');
                script.setAttribute('type', 'application/ld+json');
                script.setAttribute('data-seo-jsonld', 'true');
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(structuredData);
        }

        // Cleanup on unmount
        return () => {
            document.title = 'Catwalk.AI';
        };
    }, [title, description, keywords, canonicalUrl, ogImage, ogType, structuredData]);

    return null; // This component doesn't render anything
}

export default SEO;
