'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface DescontoCardProps {
  onCtaClick?: () => void;
  title?: string;
  description?: string;
  code?: string;
  validUntil?: string;
  buttonText?: string;
}

const DescontoCard: React.FC<DescontoCardProps> = ({
  onCtaClick,
  title,
  description,
  code,
  validUntil,
  buttonText
}) => {
  const t = useTranslations('descontoCard');

  return (
    <section className="pb-15 pt-4 px-4 bg-white">
      <div className="max-w-md mx-auto">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Image Section - Top */}
          <div className="relative h-70 w-full">
            <Image
              src="/images/desconto.png"
              alt={t('imageAlt')}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Content Section - Bottom */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-8 text-center text-white relative">
            
            {/* Title */}
            <h2 className="text-4xl font-fertigo font-bold mb-6">
              {title || t('title')}
            </h2>
            
            {/* Description */}
            <p className="text-lg font-medium mb-2 font-sans">
              {description || t('description')}
            </p>
            
            {/* Code and Date */}
            <div className="space-y-2 mb-10">
              <div className="text-sm font-medium font-fertigo">
                {t('validUntil')} {validUntil || t('validUntilDate')}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onCtaClick}
              className="w-full bg-transparent text-white font-bold py-5 px-6 rounded-full border-1 border-white hover:bg-green-400 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {buttonText || t('buttonText')}
            </button>

            {/* Decorative elements */}
            <div className="absolute top-2 right-2 text-xl animate-bounce">❄️</div>
            <div className="absolute bottom-2 left-2 text-lg animate-bounce" style={{ animationDelay: '1s' }}>❄️</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DescontoCard;