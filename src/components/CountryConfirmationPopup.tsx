'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface CountryOption {
  code: string;
  locale: string;
  flag: string;
  name: string;
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'BR', locale: 'pt', flag: '🇧🇷', name: 'Brasil' },
  { code: 'PT', locale: 'pt', flag: '🇵🇹', name: 'Portugal' },
  { code: 'ES', locale: 'es', flag: '🇪🇸', name: 'España' },
  { code: 'MX', locale: 'es', flag: '🇲🇽', name: 'México' },
  { code: 'AR', locale: 'es', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CO', locale: 'es', flag: '🇨🇴', name: 'Colombia' },
  { code: 'US', locale: 'en', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', locale: 'en', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'CA', locale: 'en', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', locale: 'en', flag: '🇦🇺', name: 'Australia' }
];

export default function CountryConfirmationPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('countryDetection');
  
  const [isVisible, setIsVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Verificar se deve mostrar o popup
  useEffect(() => {
    const shouldShow = searchParams.get('country_detected') === 'true';
    const detectedCountry = searchParams.get('detected_country');
    const detectedLocale = searchParams.get('detected_locale');

    if (shouldShow && detectedCountry && detectedLocale) {
      setIsVisible(true);
    }
  }, [searchParams]);

  // Função para confirmar o país detectado
  const confirmCountry = () => {
    // Remover parâmetros de detecção da URL
    const url = new URL(window.location.href);
    url.searchParams.delete('country_detected');
    url.searchParams.delete('detected_country');
    url.searchParams.delete('detected_locale');
    
    // Atualizar URL sem recarregar a página
    window.history.replaceState({}, '', url.toString());
    
    setIsVisible(false);
  };

  // Função para alterar país/idioma
  const changeCountry = (countryCode: string, locale: string) => {
    setIsChanging(true);
    
    // Construir nova URL com o locale correto
    const currentLocale = pathname.split('/')[1];
    const newPathname = pathname.replace(`/${currentLocale}`, `/${locale}`);
    
    // Remover parâmetros de detecção
    const url = new URL(window.location.href);
    url.pathname = newPathname;
    url.searchParams.delete('country_detected');
    url.searchParams.delete('detected_country');
    url.searchParams.delete('detected_locale');
    
    // Redirecionar para o novo locale
    router.push(url.toString());
  };

  // Obter informações do país detectado
  const getDetectedCountryInfo = () => {
    const detectedCountry = searchParams.get('detected_country');
    const detectedLocale = searchParams.get('detected_locale');
    
    if (!detectedCountry || !detectedLocale) return null;
    
    return COUNTRY_OPTIONS.find(option => 
      option.code === detectedCountry || option.locale === detectedLocale
    ) || COUNTRY_OPTIONS.find(option => option.locale === detectedLocale);
  };

  const detectedCountryInfo = getDetectedCountryInfo();

  if (!isVisible || !detectedCountryInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
          <div className="text-4xl mb-2">🌍</div>
          <h2 className="text-xl font-bold mb-1">
            {t('title', { defaultValue: 'Detectamos seu país!' })}
          </h2>
          <p className="text-red-100 text-sm">
            {t('subtitle', { defaultValue: 'Confirme para uma melhor experiência' })}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* País detectado */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
              <span className="text-3xl">{detectedCountryInfo.flag}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {detectedCountryInfo.name}
            </h3>
            <p className="text-sm text-gray-600">
              {t('detectedMessage', { 
                defaultValue: 'Detectamos que você está navegando do(a) {{country}}',
                country: detectedCountryInfo.name 
              })}
            </p>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            {/* Confirmar país */}
            <button
              onClick={confirmCountry}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('confirmButton', { defaultValue: 'Sim, está correto!' })}
              </span>
            </button>

            {/* Alterar país */}
            <div className="relative">
              <button
                onClick={() => setIsChanging(!isChanging)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-200"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {t('changeButton', { defaultValue: 'Alterar país/idioma' })}
                </span>
              </button>

              {/* Lista de países */}
              {isChanging && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                  {COUNTRY_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => changeCountry(option.code, option.locale)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 flex items-center border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-2xl mr-3">{option.flag}</span>
                      <div>
                        <div className="font-medium text-gray-800">{option.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{option.locale}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Informação adicional */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              {t('infoMessage', { 
                defaultValue: 'Você pode alterar o idioma a qualquer momento no menu superior' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}