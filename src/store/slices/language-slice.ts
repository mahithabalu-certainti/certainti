import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { defaultlang, ILanguageState } from '../type';

const initialState: ILanguageState = {
  currentLanguage: defaultlang,
};

export const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLang: (state, action: PayloadAction<ILanguageState>) => {
      state.currentLanguage = action.payload.currentLanguage;
    },
  },
});

export const { setLang } = languageSlice.actions;
