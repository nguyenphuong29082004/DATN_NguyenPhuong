import { Link } from 'react-router-dom';
import './BecomeModelPage.css';
import { LandingHeader, LandingFooter } from '../../components/landing';
import { SEO } from '../../components/common';

// SEO Configuration
const SEO_CONFIG = {
  title: 'Become an AI Fashion Model',
  description: 'Turn yourself into a licensable AI fashion model. Earn passive income by licensing your AI likeness to top fashion brands worldwide. No studio time required — work 24/7 while you sleep.',
  keywords: [
    'AI fashion model',
    'become a model',
    'AI modeling',
    'fashion AI',
    'virtual model',
    'digital modeling',
    'earn money modeling',
    'passive income modeling',
    'license your likeness',
    'Catwalk AI',
  ],
  canonicalUrl: 'https://catwalk.ai/models/register',
  ogImage: 'https://catwalk.ai/og-become-model.jpg',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Become an AI Fashion Model | Catwalk.AI',
    description: 'Turn yourself into a licensable AI fashion model. Earn passive income by licensing your AI likeness to fashion brands.',
    url: 'https://catwalk.ai/models/register',
    mainEntity: {
      '@type': 'Service',
      name: 'AI Fashion Modeling Platform',
      provider: {
        '@type': 'Organization',
        name: 'Catwalk.AI',
        url: 'https://catwalk.ai',
      },
      description: 'Create your AI fashion model and license it to brands worldwide',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free to join, earn royalties from brand campaigns',
      },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://catwalk.ai',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Become a Model',
          item: 'https://catwalk.ai/models/register',
        },
      ],
    },
  },
};

const BENEFITS = [
  {
    icon: 'paid',
    title: 'Earn Passive Income',
    description: 'License your AI model to brands worldwide and earn royalties from every campaign.',
  },
  {
    icon: 'trending_up',
    title: 'Expand Your Reach',
    description: 'Get featured in fashion campaigns without location or scheduling constraints.',
  },
  {
    icon: 'verified',
    title: 'Maintain Control',
    description: 'You decide which brands can use your likeness and for what type of content.',
  },
  {
    icon: 'schedule',
    title: 'Save Time',
    description: 'No more hours in the studio. Your AI model works 24/7 while you focus on what matters.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Choose between real-life modeling or AI fashion model creation.',
  },
  {
    number: '02',
    title: 'Set Your Rates',
    description: 'Define your earning targets and licensing preferences.',
  },
  {
    number: '03',
    title: 'Upload Your Content',
    description: 'Add your best photos and videos, connect your social accounts.',
  },
  {
    number: '04',
    title: 'Go Live',
    description: 'Get discovered by top fashion brands and start earning.',
  },
];

const TESTIMONIALS = [
  {
    quote: "I've earned more in 3 months with Catwalk.AI than I did in a year of traditional modeling gigs.",
    author: 'Jessica M.',
    role: 'Fashion Model',
  },
  {
    quote: "The flexibility is incredible. I can approve campaigns from my phone while traveling.",
    author: 'David K.',
    role: 'Commercial Model',
  },
];

export function BecomeModelPage() {
  return (
    <div className="become-model-page">
      <SEO {...SEO_CONFIG} />
      <LandingHeader />

      <main className="become-model-main">
        {/* Hero Section */}
        <section className="become-model-hero">
          <div className="become-model-hero__content">
            <span className="become-model-hero__badge">
              <span className="material-symbols-outlined">auto_awesome</span>
              AI-Powered Modeling
            </span>
            <h1 className="become-model-hero__title">
              Become an <em>AI Fashion Model</em>
            </h1>
            <p className="become-model-hero__description">
              Turn yourself and your content into a licensable AI fashion model.
              Brands can select and feature you in photo or video shoots while
              you earn licensing income — without being there.
            </p>
            <div className="become-model-hero__actions">
              <Link to="/models/register" className="become-model-hero__cta">
                <span>Start Your Journey</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <a href="#how-it-works" className="become-model-hero__secondary">
                Learn How It Works
              </a>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="become-model-benefits">
          <div className="become-model-benefits__container">
            <h2 className="become-model-section-title">Why Join Catwalk.AI?</h2>
            <p className="become-model-section-subtitle">
              Unlock new opportunities in the fashion industry with AI technology
            </p>
            <div className="become-model-benefits__grid">
              {BENEFITS.map((benefit) => (
                <div key={benefit.title} className="benefit-card">
                  <div className="benefit-card__icon">
                    <span className="material-symbols-outlined">{benefit.icon}</span>
                  </div>
                  <h3 className="benefit-card__title">{benefit.title}</h3>
                  <p className="benefit-card__description">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="become-model-steps">
          <div className="become-model-steps__container">
            <h2 className="become-model-section-title">How It Works</h2>
            <p className="become-model-section-subtitle">
              Get started in just a few simple steps
            </p>
            <div className="become-model-steps__grid">
              {STEPS.map((step) => (
                <div key={step.number} className="step-card">
                  <span className="step-card__number">{step.number}</span>
                  <h3 className="step-card__title">{step.title}</h3>
                  <p className="step-card__description">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="become-model-testimonials">
          <div className="become-model-testimonials__container">
            <h2 className="become-model-section-title">What Our Models Say</h2>
            <div className="become-model-testimonials__grid">
              {TESTIMONIALS.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <span className="material-symbols-outlined testimonial-card__icon">
                    format_quote
                  </span>
                  <p className="testimonial-card__quote">{testimonial.quote}</p>
                  <div className="testimonial-card__author">
                    <span className="testimonial-card__name">{testimonial.author}</span>
                    <span className="testimonial-card__role">{testimonial.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="become-model-cta">
          <div className="become-model-cta__container">
            <h2 className="become-model-cta__title">Ready to Transform Your Modeling Career?</h2>
            <p className="become-model-cta__description">
              Join thousands of models already earning with Catwalk.AI
            </p>
            <Link to="/models/register" className="become-model-cta__btn">
              <span className="material-symbols-outlined">rocket_launch</span>
              <span>Get Started Now — It's Free</span>
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

export default BecomeModelPage;
