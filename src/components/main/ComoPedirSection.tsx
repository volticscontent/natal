'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface Step {
  title: string;
  description: string;
}

interface ComoPedirSectionProps {
  onCtaClick?: () => void;
}

const ComoPedirSection: React.FC<ComoPedirSectionProps> = ({ onCtaClick }) => {
  const t = useTranslations('howToOrder');

  return (
    <section className="section-how-to-order-wrapper py-10 md:py-24 bg-[#ffebd0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="section-title text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-[#141414] mb-4 font-fertigo">
            {t('title')}
          </h2>
        </div>

        {/* Section How to Order */}
        <div className="section-how-to-order mx-5 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {t.raw('steps').map((step: Step, index: number) => (
            <div key={index} className={`point point-${index + 1} flex flex-row items-start gap-4 text-left`}>
              {/* Number */}
              <div className="number relative flex-shrink-0">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#c92828] text-white rounded-full flex items-center justify-center text-lg md:text-xl font-bold font-fertigo shadow-lg">
                  {index + 1}
                </div>
              </div>
              
              {/* Text */}
              <div className="text space-y-1 flex-1">
                <h3 className="text-2xl md:text-2xl font-bold font-fertigo text-[#141414] font-serif">
                  {step.title}
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        {onCtaClick && (
          <div className="text-center mt-16 bg-gradient-to-r from-red-50 to-green-50 rounded-3xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold font-fertigo text-gray-800 mb-4">
              Pronto para criar a magia?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Comece agora e veja o sorriso no rosto da sua criança com um vídeo personalizado do Papai Noel!
            </p>
            
            <button
              onClick={onCtaClick}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-2 rounded-full transition-all duration-300 transform hover:scale-105 uppercase tracking-wide"
            >
              Criar vídeo agora
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ComoPedirSection;