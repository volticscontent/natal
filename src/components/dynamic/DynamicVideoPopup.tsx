'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Interface para as props do VideoPopup
interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
}

// Importação dinâmica do VideoPopup com loading
const VideoPopup = dynamic(() => import('@/components/main/VideoPopup'), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  ),
  ssr: false, // Não renderizar no servidor para melhor performance
});

export default VideoPopup as ComponentType<VideoPopupProps>;