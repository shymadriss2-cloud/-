import type { AppColorPalette } from '../types/plan';

export interface PaletteOption {
  id: AppColorPalette;
  title: string;
  subtitle: string;
  ornamentLabel: string;
  lightSwatch: string;
  darkSwatch: string;
  lightSecondary: string;
  darkSecondary: string;
  lightCanvas: string;
  darkCanvas: string;
}

export const COLOR_PALETTES: PaletteOption[] = [
  {
    id: 'emerald',
    title: 'واحة الزمرد',
    subtitle: 'خلفية نعناعية غنية وزمرد عميق مع ذهب عتيق',
    ornamentLabel: 'زخرفة نجمة الحزب',
    lightSwatch: '#146C51',
    darkSwatch: '#48CB9E',
    lightSecondary: '#B57214',
    darkSecondary: '#E7B455',
    lightCanvas: '#CCE6DA',
    darkCanvas: '#071611',
  },
  {
    id: 'linen',
    title: 'ورق المصحف',
    subtitle: 'رقّ عتيق دافئ مع أخضر زيتي ونحاس مُذهّب',
    ornamentLabel: 'شمسية تذهيب المصحف',
    lightSwatch: '#215F4C',
    darkSwatch: '#60C4A1',
    lightSecondary: '#9E4C21',
    darkSecondary: '#E58D5C',
    lightCanvas: '#E5D6B8',
    darkCanvas: '#15110A',
  },
  {
    id: 'sapphire',
    title: 'لازورد أندلسي',
    subtitle: 'غلاف سماوي مشبع وأزرق أندلسي مع زعفران ذهبي',
    ornamentLabel: 'أقواس قرطبة المتداخلة',
    lightSwatch: '#164E96',
    darkSwatch: '#69B2FF',
    lightSecondary: '#B56F12',
    darkSecondary: '#F2B549',
    lightCanvas: '#C9DCF5',
    darkCanvas: '#071021',
  },
  {
    id: 'teal',
    title: 'فيروز المحيط',
    subtitle: 'تدرجات فيروزية مائية متناغمة مع لمسة مرجان دافئة',
    ornamentLabel: 'وردة القاشاني الفيروزية',
    lightSwatch: '#0A7378',
    darkSwatch: '#3FD5CF',
    lightSecondary: '#BF4F2C',
    darkSecondary: '#F08B65',
    lightCanvas: '#C0E8E5',
    darkCanvas: '#061619',
  },
  {
    id: 'olive',
    title: 'زيتون المدينة',
    subtitle: 'خضرة الزيتون الدافئة مع عسل العنبر وتباين مريح',
    ornamentLabel: 'إكليل الزيتون الهندسي',
    lightSwatch: '#4A681B',
    darkSwatch: '#A8CC54',
    lightSecondary: '#A85F16',
    darkSecondary: '#E8AA4D',
    lightCanvas: '#DAE6C3',
    darkCanvas: '#0F1608',
  },
  {
    id: 'amber',
    title: 'عقيق الصحراء',
    subtitle: 'دفء العسل والعقيق الذهبي مع تباين أخضر زمردي',
    ornamentLabel: 'شمسية العقيق الذهبية',
    lightSwatch: '#9C590C',
    darkSwatch: '#F2B646',
    lightSecondary: '#156A54',
    darkSecondary: '#4CC9A4',
    lightCanvas: '#EED9B4',
    darkCanvas: '#171006',
  },
  {
    id: 'sunset',
    title: 'شفق المرجان',
    subtitle: 'لمسة مرجانية مشبعة تتناغم مع أرجواني التوت العميق',
    ornamentLabel: 'مقرنصات وهلال الشفق',
    lightSwatch: '#BF412B',
    darkSwatch: '#F5866B',
    lightSecondary: '#7A2954',
    darkSecondary: '#DB7FB0',
    lightCanvas: '#F4CFC3',
    darkCanvas: '#1A0D0B',
  },
  {
    id: 'rose',
    title: 'ورد دمشقي',
    subtitle: 'نسمات وردية دمشقية غنية مع لمسة خضراء نباتية',
    ornamentLabel: 'الوردة الدمشقية الثمانية',
    lightSwatch: '#BA3864',
    darkSwatch: '#F693B5',
    lightSecondary: '#1D6B56',
    darkSecondary: '#5AC9A7',
    lightCanvas: '#F3CBD9',
    darkCanvas: '#190B12',
  },
  {
    id: 'plum',
    title: 'لافندر السَحَر',
    subtitle: 'أرجواني الخزامى الملكي متوج بتفاصيل ذهبية ناعمة',
    ornamentLabel: 'مشكاة وفانوس السَحَر',
    lightSwatch: '#603885',
    darkSwatch: '#C59BE8',
    lightSecondary: '#B36F14',
    darkSecondary: '#EDC05C',
    lightCanvas: '#DED0F2',
    darkCanvas: '#120B1C',
  },
  {
    id: 'burgundy',
    title: 'عنابي ملكي',
    subtitle: 'فخامة العنابي العميق مع وردي هادئ وتذهيب ملكي',
    ornamentLabel: 'معيّن التذهيب الملكي',
    lightSwatch: '#821A36',
    darkSwatch: '#E36484',
    lightSecondary: '#A66B14',
    darkSecondary: '#E8B85A',
    lightCanvas: '#ECC9D2',
    darkCanvas: '#18090E',
  },
];
