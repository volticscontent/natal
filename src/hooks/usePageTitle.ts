'use client';

import { useEffect } from 'react';

interface PageTitleConfig {
  title: string;
  description?: string;
  locale?: string;
}

export function usePageTitle(config: PageTitleConfig) {

  useEffect(() => {
    // Atualizar título da página
    if (typeof document !== 'undefined') {
      document.title = config.title;
      
      // Atualizar meta description se fornecida
      if (config.description) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', config.description);
        } else {
          // Criar meta description se não existir
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = config.description;
          document.head.appendChild(meta);
        }
      }

      // Atualizar Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', config.title);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        meta.content = config.title;
        document.head.appendChild(meta);
      }

      // Atualizar Open Graph description
      if (config.description) {
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
          ogDescription.setAttribute('content', config.description);
        } else {
          const meta = document.createElement('meta');
          meta.setAttribute('property', 'og:description');
          meta.content = config.description;
          document.head.appendChild(meta);
        }
      }
    }
  }, [config.title, config.description]);

  return {
    setTitle: (newTitle: string) => {
      if (typeof document !== 'undefined') {
        document.title = newTitle;
      }
    }
  };
}

// Hook específico para páginas de personalização
export function usePersonalizationPageTitle(step: string, locale: string) {
  
  const getTitleForStep = (step: string): string => {
    const titles: Record<string, Record<string, string>> = {
      '1': {
        pt: 'Personalização - Quantas Crianças | Recadinhos do Papai Noel',
        en: 'Personalization - How Many Children | Santa Messages',
        es: 'Personalización - Cuántos Niños | Mensajes de Papá Noel'
      },
      '2': {
        pt: 'Personalização - Extras | Recadinhos do Papai Noel',
        en: 'Personalization - Extras | Santa Messages',
        es: 'Personalización - Extras | Mensajes de Papá Noel'
      },
      '3': {
        pt: 'Personalização - Dados das Crianças | Recadinhos do Papai Noel',
        en: 'Personalization - Children Data | Santa Messages',
        es: 'Personalización - Datos de los Niños | Mensajes de Papá Noel'
      }
    };

    return titles[step]?.[locale] || titles[step]?.['pt'] || 'Recadinhos do Papai Noel';
  };

  const getDescriptionForStep = (step: string): string => {
    const descriptions: Record<string, Record<string, string>> = {
      '1': {
        pt: 'Escolha quantas crianças receberão o vídeo personalizado do Papai Noel',
        en: 'Choose how many children will receive the personalized Santa video',
        es: 'Elige cuántos niños recibirán el video personalizado de Papá Noel'
      },
      '2': {
        pt: 'Adicione extras especiais ao seu vídeo personalizado do Papai Noel',
        en: 'Add special extras to your personalized Santa video',
        es: 'Añade extras especiales a tu video personalizado de Papá Noel'
      },
      '3': {
        pt: 'Preencha os dados das crianças para personalizar o vídeo do Papai Noel',
        en: 'Fill in the children\'s data to personalize the Santa video',
        es: 'Completa los datos de los niños para personalizar el video de Papá Noel'
      }
    };

    return descriptions[step]?.[locale] || descriptions[step]?.['pt'] || 'Crie vídeos personalizados do Papai Noel';
  };

  const title = getTitleForStep(step);
  const description = getDescriptionForStep(step);

  usePageTitle({ title, description, locale });

  return { title, description };
}

// Hook para páginas de checkout
export function useCheckoutPageTitle(locale: string) {
  const titles: Record<string, string> = {
    pt: 'Finalizando Pedido | Recadinhos do Papai Noel',
    en: 'Completing Order | Santa Messages',
    es: 'Completando Pedido | Mensajes de Papá Noel'
  };

  const descriptions: Record<string, string> = {
    pt: 'Finalize seu pedido e receba o vídeo personalizado do Papai Noel',
    en: 'Complete your order and receive the personalized Santa video',
    es: 'Completa tu pedido y recibe el video personalizado de Papá Noel'
  };

  const title = titles[locale] || titles['pt'];
  const description = descriptions[locale] || descriptions['pt'];

  usePageTitle({ title, description, locale });

  return { title, description };
}

// Hook para páginas de agradecimento
export function useThankYouPageTitle(locale: string, provider?: string) {
  const titles: Record<string, string> = {
    pt: 'Pedido Confirmado! | Recadinhos do Papai Noel',
    en: 'Order Confirmed! | Santa Messages',
    es: 'Pedido Confirmado! | Mensajes de Papá Noel'
  };

  const descriptions: Record<string, string> = {
    pt: 'Seu pedido foi confirmado! O vídeo personalizado do Papai Noel será enviado em breve',
    en: 'Your order has been confirmed! The personalized Santa video will be sent soon',
    es: 'Tu pedido ha sido confirmado! El video personalizado de Papá Noel será enviado pronto'
  };

  const title = titles[locale] || titles['pt'];
  const description = descriptions[locale] || descriptions['pt'];

  usePageTitle({ title, description, locale });

  return { title, description };
}