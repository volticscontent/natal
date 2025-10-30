'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface EspalhaBondadeSectionProps {
  onCtaClick?: () => void;
}

const EspalhaBondadeSection: React.FC<EspalhaBondadeSectionProps> = ({
  onCtaClick
}) => {
  const t = useTranslations('charitySection');

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-cyan-200 via-cyan-300 to-cyan-400 relative overflow-hidden">
      {/* Decorative Stars */}
      <div className="absolute top-10 right-10 text-yellow-400 text-2xl">⭐</div>
      <div className="absolute bottom-20 left-10 text-yellow-300 text-xl">⭐</div>
      <div className="absolute bottom-10 right-1/3 text-yellow-500 text-xl">⭐</div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* GRAACC Logo and Institution */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/90 px-6 py-3 rounded-lg shadow-lg mb-4">
            <div className="w-16 h-12 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">GRAACC</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">{t('institutionLabel')}</p>
              <p className="text-xs text-blue-600 font-medium">www.graacc.org.br</p>
            </div>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-fertigo font-bold text-black mb-6">
            {t('title')}
          </h2>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl p-8 md:p-12">
          <div className="text-center">
            <p 
              className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: t('description') }}
            />

            {/* CTA Button */}
            <div className="mb-6">
              <button
                onClick={onCtaClick}
                className="text-black font-fertigo font-bold py-4 px-8 text-lg"
              >
                {t('ctaButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EspalhaBondadeSection;