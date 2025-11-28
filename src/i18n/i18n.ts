import { getRequestConfig } from 'next-intl/server';

// Locales suportados e tipos auxiliares
const supportedLocales = ['pt', 'en', 'es'] as const;
type SupportedLocale = (typeof supportedLocales)[number];

// Cache para evitar múltiplas importações (inicialmente vazio, preenchido sob demanda)
// Use Partial para não exigir que todas as chaves existam na inicialização
const messagesCache: Partial<Record<SupportedLocale, Record<string, string>>> = {};

// Cache apenas para o locale VÁLIDO da requisição atual
let currentRequestLocale: SupportedLocale | null = null;

export default getRequestConfig(async ({ locale: rawLocale }) => {
  console.log('i18n config - Locale recebido:', rawLocale);

  // Validar o locale recebido; tratar valores não suportados (ex.: "video-papai-noel") como indefinidos
  const isSupported = (val: unknown): val is SupportedLocale =>
    typeof val === 'string' && supportedLocales.includes(val as SupportedLocale);

  let resolvedLocale: SupportedLocale | null = null;

  if (isSupported(rawLocale)) {
    resolvedLocale = rawLocale;
    currentRequestLocale = resolvedLocale; // armazenar SOMENTE valores suportados
  }

  // Se ainda não temos um locale válido, usar o da requisição atual (se houver) ou fallback para 'pt'
  if (!resolvedLocale) {
    resolvedLocale = currentRequestLocale ?? 'pt';
    console.log('i18n config - Usando locale de fallback:', resolvedLocale);
  }

  const currentLocale = resolvedLocale;
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