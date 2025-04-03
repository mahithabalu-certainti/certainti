import { useTranslation } from 'react-i18next';

type TNamespace = 'core' | 'sop' | 'invoice';

export const useAppTranslation = () => {
  const [t] = useTranslation(['core', 'sop', 'invoice']);

  const translate = (namespace: TNamespace, key: string) => {
    return t(`${key}`, { ns: namespace });
  };

  return translate;
};
