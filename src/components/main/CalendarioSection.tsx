'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface CalendarioSectionProps {
  onCtaClick?: () => void;
}

const CalendarioSection: React.FC<CalendarioSectionProps> = ({
  onCtaClick
}) => {
  const t = useTranslations('calendar');

  return (
    <section className="bg-[#e6d89d] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Imagem do Calendário */}
          <div className="relative">
            <Image
              src="/images/calendario.webp"
              alt={t('title')}
              width={600}
              height={400}
              className="w-full h-auto rounded-lg shadow-lg"
              priority
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-6 px-[2rem]">
            {/* Badge GRÁTIS */}
            <div className="inline-block">
              <span className="bg-[#f4f5c0] text-black px-4 py-2 text-sm text-[1rem] font-bold uppercase tracking-wide">
                {t('badge')}
              </span>
            </div>

            {/* Título */}
            <h2 className="text-4xl md:text-5xl font-fertigo font-bold text-gray-800 leading-tight">
              {t('title')}
            </h2>

            {/* Descrição */}
            <p className="text-lg text-gray-700 leading-relaxed">
              {t('description')}
            </p>

            {/* Lista de benefícios */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{t('features.0')}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{t('features.1')}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{t('features.2')}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{t('features.3')}</span>
              </div>
            </div>

            {/* Botão CTA */}
            <div className="pt-4">
              <button
                onClick={onCtaClick}
                className="text-black underline font-bold py-4 px-8 text-lg transition-colors duration-200 transform hover:scale-105 transition-transform"
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

export default CalendarioSection;