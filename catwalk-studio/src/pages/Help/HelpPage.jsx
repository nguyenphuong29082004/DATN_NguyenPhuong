import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LandingHeader, LandingFooter } from '../../components/landing';
import { useLanguage } from '../../contexts/LanguageContext';
import './HelpPage.css';

const HELP_TOPIC_IDS = [
    'generate-ai-photos',
    'turn-prompts-into-fashion',
    'youtube-fashion-ideas',
    'generate-3d-model',
    'upscale-photos-videos',
    'batch-try-on',
    'virtual-try-ons-real-models',
    'make-ai-influencers',
    'fashion-shoots-videos',
    'shopify-models',
    'change-background',
    'combine-photos',
    'pricing',
    'payment-refunds',
    'privacy-data',
    'commercial-rights',
];

export default function HelpPage() {
    const { hash } = useLocation();
    const { t } = useLanguage();

    const helpTopics = HELP_TOPIC_IDS.map(id => ({
        id,
        title: t(`help.topics.${id}`),
    }));

    useEffect(() => {
        if (hash) {
            setTimeout(() => {
                const targetElement = document.getElementById(hash.substring(1));
                if (targetElement) {
                    const navOffset = 100;
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
                        <h2 className="help-sidebar__title">{t('help.title')}</h2>
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
                        <h1 className="help-page__title">{t('help.faq')}</h1>

                        <div className="help-articles__list">
                            {helpTopics.map(topic => (
                                <article key={topic.id} id={topic.id} className="help-article">
                                    <h3 className="help-article__title">{topic.title}</h3>
                                    <div className="help-article__body">
                                        <p>{t('help.infoWillBeUpdated', { topic: topic.title })}</p>
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
