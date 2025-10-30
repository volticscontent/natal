'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const FooterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const t = useTranslations('footer');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar lógica de newsletter aqui
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <footer className="bg-stone-100 text-black py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content */}
        <div className="mb-12">
          {/* Hero Text */}
          <div className="mb-8">
            <h2 
              className="text-2xl md:text-3xl font-normal font-fertigo leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: t('heroText') }}
            />
          </div>

          {/* Elfi Logo */}
          <div className="mb-8">
            <Image
              src="/images/logo_65x91.webp"
              alt={t('logoAlt')}
              width={50}
              height={50}
            />
          </div>

          {/* Newsletter Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">
              {t('newsletter.title')}
            </h3>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-600 placeholder-gray-400"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors duration-200 font-medium"
              >
                {t('newsletter.button')}
              </button>
            </form>
            <div className="mt-3">
              <Link 
                href="/politica-dados" 
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                {t('newsletter.privacyPolicy')}
              </Link>
            </div>
          </div>

          {/* Products Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              {t('products.title')}
            </h3>
            <div className="space-y-2">
              <div>
                <Link 
                  href="/video-papai-noel" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  {t('products.santaVideo')}
                </Link>
              </div>
              <div>
                <Link 
                  href="/gratis" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  {t('products.free')}
                </Link>
              </div>
              <div>
                <Link 
                  href="/calendario-advento" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  {t('products.adventCalendar')}
                </Link>
              </div>
              <div>
                <Link 
                  href="/avaliacoes" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  {t('products.reviews')}
                </Link>
              </div>
              <div>
                <Link 
                  href="/lista-precos" 
                  className="text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  {t('products.priceList')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;