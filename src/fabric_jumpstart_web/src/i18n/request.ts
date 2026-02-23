import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'en';

  const localeFiles = [
    'header',
    'home',
    'markdown',
    'scenarios',
    'universe',
  ];

  const messages: Record<string, any> = {};
  for (const file of localeFiles) {
    const imported = await import(`../../locales/en/${file}.json`);
    messages[file] = imported.default;
  }

  return {
    locale,
    messages,
  };
});
