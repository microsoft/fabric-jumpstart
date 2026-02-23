import { useTranslations } from 'next-intl';

export interface UseTranslationReturn {
  t: (key: string, query?: any, options?: any) => string;
  lang: string;
}

export function useTranslation(namespace?: string): UseTranslationReturn {
  const t = useTranslations(namespace);

  const translateFunction = (
    key: string,
    query?: any,
    options?: any
  ): string => {
    try {
      if (options && options.returnObjects) {
        const result = t.raw(key);
        return result;
      }

      if (query && typeof query === 'object') {
        if (
          query.count !== undefined ||
          Object.keys(query).some(
            (k) => typeof query[k] === 'string' || typeof query[k] === 'number'
          )
        ) {
          return t(key, query);
        }
      }

      return t(key);
    } catch (error) {
      console.warn(
        `Translation missing for key: ${namespace ? namespace + '.' : ''}${key}`
      );
      return key;
    }
  };

  return {
    t: translateFunction,
    lang: 'en',
  };
}

export default useTranslation;
