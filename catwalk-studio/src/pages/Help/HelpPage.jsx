import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LandingHeader, LandingFooter } from '../../components/landing';
import './HelpPage.css';

const helpTopics = [
    { id: 'generate-ai-photos', title: 'Generate AI photos and videos of yourself' },
    { id: 'turn-prompts-into-fashion', title: 'Turn prompts into stunning fashion ideas' },
    { id: 'youtube-fashion-ideas', title: 'How to create AI fashion ideas for YouTube' },
    { id: 'generate-3d-model', title: 'Generate a 3D model from a photo' },
    { id: 'upscale-photos-videos', title: 'Upscale your AI fashion photos and videos' },
    { id: 'batch-try-on', title: 'Batch Try On Clothes' },
    { id: 'virtual-try-ons-real-models', title: 'Generate virtual try ons with real models' },
    { id: 'make-ai-influencers', title: 'How to make AI fashion influencers' },
    { id: 'fashion-shoots-videos', title: 'How to create fashion shoots AI videos' },
    { id: 'shopify-models', title: 'Put clothes on models for Shopify store' },
    { id: 'change-background', title: 'How to change background of photos with AI' },
    { id: 'combine-photos', title: 'How to combine photos with AI' },
    { id: 'pricing', title: 'Pricing and subscription plans' },
    { id: 'payment-refunds', title: 'Payment methods and refunds' },
    { id: 'privacy-data', title: 'Data deletion and privacy' },
    { id: 'commercial-rights', title: 'Commercial usage rights' }
];

export default function HelpPage() {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            // Small timeout to allow render before scroll
            setTimeout(() => {
                const targetElement = document.getElementById(hash.substring(1));
                if (targetElement) {
                    const navOffset = 100; // Header height
                    const topPosition = targetElement.getBoundingClientRect().top + window.scrollY - navOffset;
                    window.scrollTo({
                        top: topPosition,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        }
    }, [hash]);

    return (
        <div className="help-page">
            <LandingHeader hideCTAs={false} />

            <main className="help-page__content">
                <div className="container-wide help-container">
                    <aside className="help-sidebar">
                        <h2 className="help-sidebar__title">Help & FAQ</h2>
                        <ul className="help-sidebar__nav">
                            {helpTopics.map(topic => (
                                <li key={topic.id}>
                                    <Link to={`#${topic.id}`} className={hash === `#${topic.id}` ? 'active' : ''}>
                                        {topic.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    <section className="help-articles">
                        <h1 className="help-page__title">Frequently Asked Questions</h1>

                        <div className="help-articles__list">
                            {helpTopics.map(topic => (
                                <article key={topic.id} id={topic.id} className="help-article">
                                    <h3 className="help-article__title">{topic.title}</h3>
                                    <div className="help-article__body">
                                        <p>Information regarding "{topic.title}" will be updated here shortly.</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
