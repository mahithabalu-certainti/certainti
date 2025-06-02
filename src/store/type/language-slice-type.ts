export enum Language {
  ENGLISH = 'en',
}

export interface ILanguageState {
  currentLanguage: Language;
}

export const defaultlang = Language.ENGLISH;
