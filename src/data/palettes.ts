import type { AppColorPalette } from '../types/plan';

export interface PaletteOption {
  id: AppColorPalette;
  title: string;
  subtitle: string;
  lightSwatch: string;
  darkSwatch: string;
}

export const COLOR_PALETTES: PaletteOption[] = [
  {
    id: 'emerald',
    title: 'زمردي هادئ',
    subtitle: 'سكينة الفجر باللون الأخضر الزمردي',
    lightSwatch: '#1F5E4B',
    darkSwatch: '#4AA886',
  },
  {
    id: 'linen',
    title: 'ورق المصحف',
    subtitle: 'درجات ورقية دافئة مريحة للعين',
    lightSwatch: '#26594C',
    darkSwatch: '#5FB498',
  },
  {
    id: 'sapphire',
    title: 'أزرق أندلسي',
    subtitle: 'أزرق سماوي هادئ يبعث على التركيز',
    lightSwatch: '#1D4E89',
    darkSwatch: '#60A5FA',
  },
  {
    id: 'amber',
    title: 'ذهبي عتيق',
    subtitle: 'دفء العنبر الهادئ بإلهام التراث',
    lightSwatch: '#8C5E1A',
    darkSwatch: '#E0AB4F',
  },
  {
    id: 'plum',
    title: 'أرجواني هادئ',
    subtitle: 'درجة أرجوانية ناعمة ومتزنة',
    lightSwatch: '#5B3E73',
    darkSwatch: '#B794D4',
  },
];
