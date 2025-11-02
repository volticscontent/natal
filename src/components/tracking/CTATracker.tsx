'use client';

import { useEffect, useRef } from 'react';
import { useGTM } from './GTMManager';

interface CTATrackerProps {
  children: React.ReactNode;
}

export default function CTATracker({ children }: CTATrackerProps) {
  const { trackCTA, trackFormInteraction, trackScroll, trackTimeOnPage } = useGTM();
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Função para identificar e trackear CTAs
    const trackCTAClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Identificar diferentes tipos de CTAs
      const ctaSelectors = [
        'button',
        'a[href]',
        '[role="button"]',
        '.cta',
        '.btn',
        '.button',
        '[data-cta]',
        'input[type="submit"]',
        'input[type="button"]'
      ];

      // Verificar se o elemento clicado é um CTA
      const isCTA = ctaSelectors.some(selector => {
        return target.matches(selector) || target.closest(selector);
      });

      if (isCTA) {
        const ctaElement = ctaSelectors.reduce((found, selector) => {
          return found || target.closest(selector);
        }, null as Element | null) || target;

        // Extrair informações do CTA
        const ctaText = ctaElement.textContent?.trim() || 
                       ctaElement.getAttribute('aria-label') || 
                       ctaElement.getAttribute('title') || 
                       ctaElement.getAttribute('alt') || 
                       'Unknown CTA';

        const ctaHref = ctaElement.getAttribute('href');
        const ctaType = ctaElement.tagName.toLowerCase();
        const ctaClasses = ctaElement.className;
        const ctaId = ctaElement.id;
        const ctaDataCta = ctaElement.getAttribute('data-cta');

        // Determinar localização do CTA na página
        const rect = ctaElement.getBoundingClientRect();
        const ctaLocation = getCTALocation(rect, ctaElement);

        // Determinar categoria do CTA
        const ctaCategory = getCTACategory(ctaText, ctaClasses, ctaHref, ctaDataCta);

        // Enviar evento para GTM
        trackCTA(ctaText, ctaLocation, ctaType);

        // Evento adicional com mais detalhes
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'cta_detailed_click',
            cta_text: ctaText,
            cta_location: ctaLocation,
            cta_type: ctaType,
            cta_category: ctaCategory,
            cta_href: ctaHref,
            cta_classes: ctaClasses,
            cta_id: ctaId,
            cta_position_x: rect.left,
            cta_position_y: rect.top,
            cta_width: rect.width,
            cta_height: rect.height,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            scroll_position: window.scrollY,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Função para trackear interações com formulários
    const trackFormEvents = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const form = target.closest('form');
        const formName = form?.getAttribute('name') || 
                        form?.getAttribute('id') || 
                        form?.className || 
                        'unnamed_form';

        const fieldName = target.getAttribute('name') || 
                         target.getAttribute('id') || 
                         target.getAttribute('placeholder') || 
                         'unnamed_field';

        if (event.type === 'focus') {
          trackFormInteraction(formName, 'start', fieldName);
        }
      }

      if (target.tagName === 'FORM' && event.type === 'submit') {
        const formName = target.getAttribute('name') || 
                        target.getAttribute('id') || 
                        target.className || 
                        'unnamed_form';
        
        trackFormInteraction(formName, 'submit');
      }
    };

    // Função para trackear scroll
    const trackScrollDepth = () => {
      const now = Date.now();
      if (now - lastScrollTime.current < 1000) return; // Throttle para 1 segundo
      lastScrollTime.current = now;

      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

      if (scrollPercent > scrollDepthRef.current && scrollPercent % 25 === 0) {
        scrollDepthRef.current = scrollPercent;
        trackScroll(scrollPercent);
      }
    };

    // Adicionar event listeners
    container.addEventListener('click', trackCTAClick, true);
    container.addEventListener('focus', trackFormEvents, true);
    container.addEventListener('submit', trackFormEvents, true);
    window.addEventListener('scroll', trackScrollDepth, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('click', trackCTAClick, true);
      container.removeEventListener('focus', trackFormEvents, true);
      container.removeEventListener('submit', trackFormEvents, true);
      window.removeEventListener('scroll', trackScrollDepth);
    };
  }, [trackCTA, trackFormInteraction, trackScroll]);

  // Trackear tempo na página quando o componente for desmontado
  useEffect(() => {
    return () => {
      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeOnPage > 5) { // Só trackear se ficou mais de 5 segundos
        trackTimeOnPage(timeOnPage);
      }
    };
  }, [trackTimeOnPage]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
}

// Função auxiliar para determinar a localização do CTA
function getCTALocation(rect: DOMRect, element: Element): string {
  const viewportHeight = window.innerHeight;
  const elementTop = rect.top;
  
  // Verificar se está em seções específicas
  const section = element.closest('header, nav, main, footer, aside, section');
  if (section) {
    const sectionClass = section.className.toLowerCase();
    const sectionTag = section.tagName.toLowerCase();
    
    if (sectionTag === 'header' || sectionClass.includes('header')) return 'header';
    if (sectionTag === 'nav' || sectionClass.includes('nav')) return 'navigation';
    if (sectionTag === 'footer' || sectionClass.includes('footer')) return 'footer';
    if (sectionClass.includes('hero')) return 'hero';
    if (sectionClass.includes('sidebar')) return 'sidebar';
  }

  // Determinar posição vertical
  if (elementTop < viewportHeight * 0.33) return 'above_fold';
  if (elementTop < viewportHeight * 0.66) return 'middle_fold';
  return 'below_fold';
}

// Função auxiliar para categorizar CTAs
function getCTACategory(text: string, classes: string, href: string | null, dataCta: string | null): string {
  const textLower = text.toLowerCase();
  const classesLower = classes.toLowerCase();
  
  // Categorias baseadas no texto
  if (textLower.includes('comprar') || textLower.includes('buy') || textLower.includes('purchase')) return 'purchase';
  if (textLower.includes('cadastr') || textLower.includes('registr') || textLower.includes('sign up')) return 'registration';
  if (textLower.includes('login') || textLower.includes('entrar') || textLower.includes('sign in')) return 'login';
  if (textLower.includes('contato') || textLower.includes('contact') || textLower.includes('falar')) return 'contact';
  if (textLower.includes('download') || textLower.includes('baixar')) return 'download';
  if (textLower.includes('compartilh') || textLower.includes('share')) return 'share';
  if (textLower.includes('saiba mais') || textLower.includes('learn more') || textLower.includes('ver mais')) return 'learn_more';
  if (textLower.includes('próximo') || textLower.includes('next') || textLower.includes('continuar')) return 'navigation';
  if (textLower.includes('anterior') || textLower.includes('back') || textLower.includes('voltar')) return 'navigation';
  
  // Categorias baseadas nas classes
  if (classesLower.includes('primary')) return 'primary_action';
  if (classesLower.includes('secondary')) return 'secondary_action';
  if (classesLower.includes('danger') || classesLower.includes('delete')) return 'destructive';
  
  // Categorias baseadas no href
  if (href) {
    if (href.includes('mailto:')) return 'email';
    if (href.includes('tel:')) return 'phone';
    if (href.includes('whatsapp') || href.includes('wa.me')) return 'whatsapp';
    if (href.includes('facebook') || href.includes('instagram') || href.includes('twitter')) return 'social';
  }
  
  // Categoria baseada no data-cta
  if (dataCta) return dataCta;
  
  return 'general';
}