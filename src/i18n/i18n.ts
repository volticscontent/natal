import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

// Cache para evitar múltiplas importações
const messagesCache: Record<string, Record<string, string>> = {};

// Cache para o locale atual da requisição
let currentRequestLocale: string | null = null;

export default getRequestConfig(async ({ locale }) => {
  console.log('i18n config - Locale recebido:', locale);
  
  // Se o locale é undefined, tentar obter da URL através dos headers
  let resolvedLocale = locale;
  
  if (!resolvedLocale) {
    try {
      const headersList = await headers();
      const pathname = headersList.get('x-pathname') || '';
      console.log('i18n config - Pathname dos headers:', pathname);
      
      // Extrair locale da URL
      const pathSegments = pathname.split('/').filter(Boolean);
      const possibleLocale = pathSegments[0];
      
      if (['pt', 'en', 'es'].includes(possibleLocale)) {
        resolvedLocale = possibleLocale;
        console.log('i18n config - Locale extraído da URL:', resolvedLocale);
      }
    } catch (error) {
      console.log('i18n config - Erro ao obter headers:', error);
    }
  }
  
  // Se ainda não temos um locale válido, usar o locale da requisição atual ou fallback para 'pt'
  if (!resolvedLocale) {
    resolvedLocale = currentRequestLocale || 'pt';
    console.log('i18n config - Usando locale de fallback:', resolvedLocale);
  } else {
    // Armazenar o locale válido para futuras chamadas na mesma requisição
    currentRequestLocale = resolvedLocale;
  }
  
  // Validar o locale final
  const supportedLocales = ['pt', 'en', 'es'];
  const currentLocale = supportedLocales.includes(resolvedLocale) ? resolvedLocale : 'pt';
  
  console.log('i18n config - Locale usado:', currentLocale);
  
  // Verificar se já temos as mensagens no cache
  if (messagesCache[currentLocale]) {
    console.log('i18n config - Usando cache para locale:', currentLocale);
    return {
      locale: currentLocale,
      messages: messagesCache[currentLocale]
    };
  }

  // Importar mensagens dinamicamente
  const [mainMessages, persMessages] = await Promise.all([
    import(`../../messages/${currentLocale}.json`),
    import(`../../messages/pers/${currentLocale}.json`)
  ]);

  // Combinar as mensagens
  const messages = {
    ...mainMessages.default,
    pers: persMessages.default
  };

  // Armazenar no cache
  messagesCache[currentLocale] = messages;
  console.log('i18n config - Armazenando no cache para locale:', currentLocale);
  console.log('i18n config - Estrutura armazenada:', Object.keys(messages));

  return {
    locale: currentLocale,
    messages
  };
});