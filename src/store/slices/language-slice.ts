import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { ILanguageState, Language } from '../type';
const defaultlang = Language.ENGLISH;

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

export default languageSlice.reducer;
