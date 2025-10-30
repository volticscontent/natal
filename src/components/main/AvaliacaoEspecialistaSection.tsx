'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface AvaliacaoEspecialistaSectionProps {
  onCtaClick?: () => void;
}

const AvaliacaoEspecialistaSection: React.FC<AvaliacaoEspecialistaSectionProps> = ({
  onCtaClick
}) => {
  const t = useTranslations('expertSection');

  return (
    <section className="py-16 md:py-24 bg-yellow-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-100 text-black px-6 py-2 rounded-full font-medium mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span>{t('badge')}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-fertigo font-bold text-black mb-6 leading-tight">
            {t('title')}
          </h2>
          
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Card da Especialista */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="md:flex">
            {/* Foto da Especialista */}
            <div className="md:w-1/3 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center p-8">
              <div className="text-center text-white">
                <div className="w-32 h-32 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4 overflow-hidden">
                  <Image 
                    src="/images/eva.webp" 
                    alt={t('expertName')} 
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>
                <h3 className="text-4xl font-fertigo font-bold mb-2">{t('expertName')}</h3>
                <p className="text-purple-100 font-medium font-bold">{t('expertTitle')}</p>
                <p className="text-white text-sm font-bold ">{t('expertCredentials')}</p>
              </div>
            </div>

            {/* Conteúdo do Depoimento */}
            <div className="md:w-2/3 p-8 md:p-12">
              <div className="mb-6">
                <svg className="w-12 h-12 text-black mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>

              <blockquote className="text-gray-700 text-lg leading-relaxed mb-8">
                <p className="mb-4">
                  {t('testimonial.paragraph1')}
                </p>
                <p className="mb-4">
                  {t('testimonial.paragraph2')}
                </p>
                <p className="mb-4">
                  {t('testimonial.paragraph3')}
                </p>
                <p>
                  {t('testimonial.paragraph4')}
                </p>
              </blockquote>

              {/* Credenciais */}
              <div className="border-t border-purple-100 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-300 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-red-600 font-medium">{t('professionalRating')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-8 md:p-12 shadow-2xl">
          <h3 className="text-2xl md:text-3xl font-fertigo font-bold text-white mb-6">
            {t('ctaTitle')}
          </h3>
          
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            {t('ctaSubtitle')}
          </p>
          
          <button
            onClick={onCtaClick}
            className="bg-transparent text-white border-1 border-white font-fertigo font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 uppercase tracking-wide shadow-lg hover:shadow-xl"
          >
            {t('ctaButton')}
          </button>
          
          <p className="text-white/80 mt-4 text-sm">
            {t('ctaDisclaimer')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AvaliacaoEspecialistaSection;