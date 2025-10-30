'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface FloatingCarousel2Props {
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  animationDuration?: string;
}

const FloatingCarousel2: React.FC<FloatingCarousel2Props> = ({
  text,
  backgroundColor = "#FFFFFF",
  textColor = "#000000",
  animationDuration = "50s"
}) => {
  const t = useTranslations('floatingCarousel2');
  const displayText = text || t('text');

  // Função para processar o texto e aplicar o efeito apenas em "magia do Natal"
  const processTextWithEffect = (inputText: string) => {
    const magicPhrase = t('magicPhrase');
    const regex = new RegExp(`(${magicPhrase})`, 'gi');
    const parts = inputText.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === magicPhrase.toLowerCase()) {
        return (
          <span 
            key={`outlined-${index}`} 
            style={{
              color: '#FFFFFF',
              WebkitTextStroke: '10px #000000',
              paintOrder: 'stroke fill',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale'
            } as React.CSSProperties}
          >
            {part}
          </span>
        );
      }
      return <span key={`normal-${index}`}>{part}</span>;
    });
  };

  // Criar uma única string longa com separadores bem espaçados
  const createScrollingText = () => {
    const separator = "     •     ";
    const repetitions = 6;
    return Array(repetitions).fill(displayText).join(separator);
  };

  // Criar o texto com efeito de borda aplicado
  const scrollingText = processTextWithEffect(createScrollingText());

  // Estilos inline otimizados
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    backgroundColor,
    height: '165px'
  };

  const trackStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    animation: `scroll-continuous ${animationDuration} linear infinite`,
    willChange: 'transform',
    whiteSpace: 'nowrap',
    width: 'fit-content'
  };

  const textStyle: React.CSSProperties = {
    fontFamily: '"Fertigo Pro", Times, "Times New Roman", serif',
    fontSize: '52px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    color: textColor,
    paddingRight: '50px', // Espaçamento entre as repetições
    display: 'inline-block',
    flexShrink: 0
  };

  return (
    <div className="py-6" style={containerStyle}>
      <div style={trackStyle}>
        <div style={textStyle}>
          {scrollingText}
        </div>
        <div style={textStyle}>
          {scrollingText}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scroll-continuous {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (min-width: 768px) {
          .carousel-responsive {
            font-size: 40px !important;
          }
        }

        @media (min-width: 1024px) {
          .carousel-responsive {
            font-size: 48px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingCarousel2;