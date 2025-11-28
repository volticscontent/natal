'use client';

import { useEffect, useState } from 'react';

interface CheckoutRedirectLoadingProps {
  message?: string;
  onTimeout?: () => void;
  timeoutMs?: number;
}

export default function CheckoutRedirectLoading({ 
  message = "Aguarde! Estamos registrando seus dados e te redirecionando para o pagamento!",
  onTimeout,
  timeoutMs = 30000 // 30 segundos
}: CheckoutRedirectLoadingProps) {
  const [dots, setDots] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const messages = [
    "🎬 Salvando personalização do seu vídeo...",
    "📝 Registrando dados na tabela...",
    "🚂 Esquentando o trenó do Papai Noel...",
    "🎁 Preparando sua surpresa especial...",
    "💳 Enviando para o checkout seguro...",
    "✨ Finalizando os últimos detalhes..."
  ];

  useEffect(() => {
    // Animação dos pontos
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    // Timeout de segurança
    const timeout = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onTimeout, timeoutMs]);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500); // Troca mensagem a cada 1.5 segundos

    return () => clearInterval(messageTimer);
  }, [messages.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-scale-in">
        {/* Logo ou ícone */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-white animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>

        {/* Mensagem principal */}
        <h1 className="text-xl font-bold text-gray-800 mb-4 font-sans">
          {message}
        </h1>

        {/* Indicador de progresso */}
        <div className="mb-6">
          <div className="flex justify-center font-fertigo items-center space-x-1 text-lg text-red-500">
            <span>Processando</span>
            <span className="w-8 text-left">{dots}</span>
          </div>
        </div>

        {/* Barra de progresso animada */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 rounded-full relative animate-progress-fill">
            {/* Efeito de brilho que se move */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>

        {/* Mensagens dinâmicas */}
        <div className="mb-4 h-8 flex items-center justify-center">
          <p 
            key={currentMessageIndex}
            className="text-sm text-gray-700 font-medium animate-message-fade"
          >
            {messages[currentMessageIndex]}
          </p>
        </div>

        {/* Mensagem de tranquilização */}
        <p className="text-sm text-gray-600">
          Não feche esta página. Você será redirecionado automaticamente.
        </p>

        {/* Suporte */}
        <div className="mt-4">
          <a
            href="https://wa.me/552196590958"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Falar com suporte no WhatsApp
          </a>
        </div>

        {/* Ícones de segurança */}
        <div className="mt-6 flex justify-center items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Seguro</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Verificado</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { 
            opacity: 0; 
            transform: scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }

        @keyframes progress-fill {
          0% { width: 0%; }
          95% { width: 95%; }
          100% { width: 95%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes message-fade {
          0% { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          20% { 
            opacity: 1; 
            transform: translateY(0); 
          }
          80% { 
            opacity: 1; 
            transform: translateY(0); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-progress-fill {
          animation: progress-fill 3s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-message-fade {
          animation: message-fade 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
