'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useGTM } from '../tracking/GTMManager';

const FooterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const t = useTranslations('footer');
  const { trackFormInteraction, trackLead } = useGTM();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission
    trackFormInteraction('newsletter', 'submit', 'email');
    
    // Track lead generation
    trackLead({
      email: email,
      lead_source: 'newsletter_footer',
      lead_value: 0
    });
    
    // Implementar lógica de newsletter aqui
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  const handleEmailFocus = () => {
    // Track form start
    trackFormInteraction('newsletter', 'start', 'email');
  };

  return (
    <footer className="bg-stone-100 text-black py-16 min-h-[600px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content */}
        <div className="mb-12">
          {/* Hero Text - Fixed height to prevent shift */}
          <div className="mb-8 min-h-[120px] md:min-h-[140px]">
            <h2 
              className="text-2xl md:text-3xl font-normal font-fertigo leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: t('heroText') }}
            />
          </div>

          {/* Videos Logo - Fixed dimensions and aspect ratio */}
          <div className="mb-8 h-[70px] flex items-start">
            <div className="relative w-16 h-16">
              <Image
                src="/images/logo.webp"
                alt={t('logoAlt')}
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
          </div>

          {/* Newsletter Section - Fixed height */}          <div className="mb-8 min-h-[140px]">
            <label htmlFor="newsletter-email" className="text-lg font-medium mb-4 h-[28px] block">
              {t('newsletter.title')}
            </label>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md h-[48px] sm:h-[48px]">
              <input
                type="email"
                id="newsletter-email"
                name="newsletter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleEmailFocus}
                placeholder={t('newsletter.placeholder')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-600 placeholder-gray-400 h-[48px]"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors duration-200 font-medium h-[48px] whitespace-nowrap"
              >
                {t('newsletter.button')}
              </button>
            </form>
          </div>

          {/* Products Section - Fixed height */}
          <div className="min-h-[200px]">
            <h3 className="text-lg font-medium mb-4 h-[28px]">
              {t('products.title')}
            </h3>
            <div className="space-y-2">
              <div className="h-[24px]">
                <Link 
                  href="/video-papai-noel" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200 inline-block"
                >
                  {t('products.santaVideo')}
                </Link>
              </div>
              <div className="h-[24px]">
                <Link 
                  href="/gratis" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200 inline-block"
                >
                  {t('products.free')}
                </Link>
              </div>
              <div className="h-[24px]">
                <Link 
                  href="/calendario-advento" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200 inline-block"
                >
                  {t('products.adventCalendar')}
                </Link>
              </div>
              <div className="h-[24px]">
                <Link 
                  href="/avaliacoes" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200 inline-block"
                >
                  {t('products.reviews')}
                </Link>
              </div>
              <div className="h-[24px]">
                <Link 
                  href="/lista-precos" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200 inline-block"
                >
                  {t('products.priceList')}
                </Link>
                <div className="mt-3 h-[20px]">
              <Link 
                href="/politica-dados" 
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                {t('newsletter.privacyPolicy')}
              </Link>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;