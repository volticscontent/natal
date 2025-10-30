import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['pt', 'en', 'es'] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  console.log('i18n config - Locale recebido:', locale);
  
  // Validate that the incoming `locale` parameter is valid
  const validLocale = locale && locales.includes(locale as Locale) ? locale : 'pt';
  
  console.log('i18n config - Locale válido usado:', validLocale);

  // Carregar mensagens principais e de personalização
  const [mainMessages, persMessages] = await Promise.all([
    import(`../../messages/${validLocale}.json`),
    import(`../../messages/pers/${validLocale}.json`)
  ]);

  return {
    locale: validLocale,
    messages: {
      ...mainMessages.default,
      pers: persMessages.default
    }
  };
});