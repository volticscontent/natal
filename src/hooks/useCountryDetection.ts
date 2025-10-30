'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CountryDetectionResult {
  country: string;
  locale: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'ip' | 'browser' | 'timezone' | 'default';
}

interface GeolocationResponse {
  country_code?: string;
  country?: string;
  countryCode?: string;
}

// Mapeamento de países para locales suportados
const COUNTRY_TO_LOCALE: Record<string, string> = {
  // Português
  'BR': 'pt',
  'PT': 'pt',
  'AO': 'pt', // Angola
  'MZ': 'pt', // Moçambique
  'CV': 'pt', // Cabo Verde
  'GW': 'pt', // Guiné-Bissau
  'ST': 'pt', // São Tomé e Príncipe
  'TL': 'pt', // Timor-Leste
  'MO': 'pt', // Macau
  
  // Espanhol
  'ES': 'es',
  'MX': 'es',
  'AR': 'es',
  'CO': 'es',
  'PE': 'es',
  'VE': 'es',
  'CL': 'es',
  'EC': 'es',
  'GT': 'es',
  'CU': 'es',
  'BO': 'es',
  'DO': 'es',
  'HN': 'es',
  'PY': 'es',
  'SV': 'es',
  'NI': 'es',
  'CR': 'es',
  'PA': 'es',
  'UY': 'es',
  'PR': 'es',
  'GQ': 'es', // Guiné Equatorial
  
  // Inglês (default para outros países)
  'US': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'ZA': 'en',
  'IN': 'en',
  'SG': 'en',
  'MY': 'en',
  'PH': 'en',
  'HK': 'en',
  'NG': 'en',
  'KE': 'en',
  'GH': 'en',
  'UG': 'en',
  'TZ': 'en',
  'ZW': 'en',
  'BW': 'en',
  'ZM': 'en',
  'MW': 'en',
  'JM': 'en',
  'TT': 'en',
  'BB': 'en',
  'BS': 'en',
  'BZ': 'en',
  'GY': 'en',
  'SR': 'en',
  'FJ': 'en',
  'PG': 'en',
  'VU': 'en',
  'SB': 'en',
  'WS': 'en',
  'TO': 'en',
  'TV': 'en',
  'KI': 'en',
  'NR': 'en',
  'PW': 'en',
  'MH': 'en',
  'FM': 'en'
};

// APIs de geolocalização gratuitas (com fallbacks)
const GEOLOCATION_APIS = [
  {
    url: 'https://ipapi.co/json/',
    parser: (data: GeolocationResponse) => data.country_code || data.country
  },
  {
    url: 'https://ipinfo.io/json',
    parser: (data: GeolocationResponse) => data.country
  },
  {
    url: 'https://api.country.is/',
    parser: (data: GeolocationResponse) => data.country
  },
  {
    url: 'https://freeipapi.com/api/json',
    parser: (data: GeolocationResponse) => data.countryCode
  }
];

export function useCountryDetection() {
  const [result, setResult] = useState<CountryDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detectar país via IP usando múltiplas APIs
  const detectCountryByIP = async (): Promise<CountryDetectionResult | null> => {
    for (const api of GEOLOCATION_APIS) {
      try {
        console.log(`Tentando detectar país via: ${api.url}`);
        
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`API ${api.url} retornou status ${response.status}`);
          continue;
        }

        const data = await response.json();
        const countryCode = api.parser(data);

        if (countryCode && typeof countryCode === 'string') {
          const country = countryCode.toUpperCase();
          const locale = COUNTRY_TO_LOCALE[country] || 'en';
          
          console.log(`País detectado via IP: ${country} -> locale: ${locale}`);
          
          return {
            country,
            locale,
            confidence: 'high',
            source: 'ip'
          };
        }
      } catch (error) {
        console.warn(`Erro na API ${api.url}:`, error);
        continue;
      }
    }

    return null;
  };

  // Detectar país via configurações do browser
  const detectCountryByBrowser = (): CountryDetectionResult | null => {
    try {
      // Tentar via navigator.language
      if (navigator.language) {
        const lang = navigator.language.toLowerCase();
        
        // Extrair código do país se presente (ex: pt-BR -> BR)
        if (lang.includes('-')) {
          const countryCode = lang.split('-')[1].toUpperCase();
          const locale = COUNTRY_TO_LOCALE[countryCode];
          
          if (locale) {
            console.log(`País detectado via navigator.language: ${countryCode} -> locale: ${locale}`);
            return {
              country: countryCode,
              locale,
              confidence: 'medium',
              source: 'browser'
            };
          }
        }

        // Mapear idioma para locale padrão
        if (lang.startsWith('pt')) {
          return {
            country: 'BR',
            locale: 'pt',
            confidence: 'medium',
            source: 'browser'
          };
        } else if (lang.startsWith('es')) {
          return {
            country: 'ES',
            locale: 'es',
            confidence: 'medium',
            source: 'browser'
          };
        } else if (lang.startsWith('en')) {
          return {
            country: 'US',
            locale: 'en',
            confidence: 'medium',
            source: 'browser'
          };
        }
      }
    } catch (error) {
      console.warn('Erro ao detectar país via browser:', error);
    }

    return null;
  };

  // Detectar país via timezone
  const detectCountryByTimezone = (): CountryDetectionResult | null => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Mapeamento básico de timezones para países
      const timezoneToCountry: Record<string, string> = {
        'America/Sao_Paulo': 'BR',
        'America/Fortaleza': 'BR',
        'America/Recife': 'BR',
        'America/Bahia': 'BR',
        'America/Manaus': 'BR',
        'America/Campo_Grande': 'BR',
        'America/Cuiaba': 'BR',
        'America/Porto_Velho': 'BR',
        'America/Boa_Vista': 'BR',
        'America/Rio_Branco': 'BR',
        'America/Araguaina': 'BR',
        'America/Belem': 'BR',
        'America/Maceio': 'BR',
        'America/Santarem': 'BR',
        'Europe/Lisbon': 'PT',
        'Atlantic/Azores': 'PT',
        'Atlantic/Madeira': 'PT',
        'Europe/Madrid': 'ES',
        'Atlantic/Canary': 'ES',
        'Europe/Ceuta': 'ES',
        'America/Mexico_City': 'MX',
        'America/Buenos_Aires': 'AR',
        'America/Bogota': 'CO',
        'America/Lima': 'PE',
        'America/Santiago': 'CL',
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'Europe/London': 'GB',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU'
      };

      const country = timezoneToCountry[timezone];
      if (country) {
        const locale = COUNTRY_TO_LOCALE[country] || 'en';
        
        console.log(`País detectado via timezone: ${country} -> locale: ${locale}`);
        
        return {
          country,
          locale,
          confidence: 'low',
          source: 'timezone'
        };
      }
    } catch (error) {
      console.warn('Erro ao detectar país via timezone:', error);
    }

    return null;
  };

  // Função principal de detecção
  const detectCountry = useCallback(async (): Promise<CountryDetectionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Tentar detectar via IP (mais confiável)
      const ipResult = await detectCountryByIP();
      if (ipResult) {
        return ipResult;
      }

      // 2. Fallback: detectar via browser
      const browserResult = detectCountryByBrowser();
      if (browserResult) {
        return browserResult;
      }

      // 3. Fallback: detectar via timezone
      const timezoneResult = detectCountryByTimezone();
      if (timezoneResult) {
        return timezoneResult;
      }

      // 4. Fallback final: usar padrão brasileiro
      console.log('Usando país padrão: BR');
      return {
        country: 'BR',
        locale: 'pt',
        confidence: 'low',
        source: 'default'
      };

    } catch (error) {
      console.error('Erro na detecção de país:', error);
      setError('Erro ao detectar país');
      
      // Retornar padrão em caso de erro
      return {
        country: 'BR',
        locale: 'pt',
        confidence: 'low',
        source: 'default'
      };
    }
  }, []);

  // Executar detecção na inicialização
  useEffect(() => {
    detectCountry().then((detectionResult) => {
      setResult(detectionResult);
      setIsLoading(false);
    });
  }, [detectCountry]);

  // Função para forçar nova detecção
  const refetch = async () => {
    const detectionResult = await detectCountry();
    setResult(detectionResult);
    setIsLoading(false);
  };

  return {
    result,
    isLoading,
    error,
    refetch
  };
}