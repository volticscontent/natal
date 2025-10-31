'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Interface para as props do FloatingCarousel
interface FloatingCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface FloatingCarouselProps {
  cards?: FloatingCard[];
}

// Importação dinâmica do FloatingCarousel com loading
const FloatingCarousel = dynamic(() => import('@/components/main/FloatingCarousel'), {
  loading: () => (
    <div className="py-8 bg-white">
      <div className="flex justify-center">
        <div className="animate-pulse flex space-x-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-2xl p-4 w-64 h-20"></div>
          ))}
        </div>
      </div>
    </div>
  ),
  ssr: false, // Não renderizar no servidor
});

export default FloatingCarousel as ComponentType<FloatingCarouselProps>;