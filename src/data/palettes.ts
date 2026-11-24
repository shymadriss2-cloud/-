import type { AppColorPalette } from '../types/plan';

export interface PaletteOption {
  id: AppColorPalette;
  title: string;
  subtitle: string;
  ornamentLabel: string;
  lightSwatch: string;
  darkSwatch: string;
  lightCanvas: string;
  darkCanvas: string;
}

export const COLOR_PALETTES: PaletteOption[] = [
  {
    id: 'emerald',
    title: 'واحة الزمرد',
    subtitle: 'خلفية نعناعية هادئة وتفاصيل زمردية مريحة',
    ornamentLabel: 'زخرفة نجمة الحزب',
    lightSwatch: '#196B52',
    darkSwatch: '#4EC59B',
    lightCanvas: '#DCEFE7',
    darkCanvas: '#0B1A15',
  },
  {
    id: 'linen',
    title: 'ورق المصحف',
    subtitle: 'دفء الرق العتيق الممزوج بأخضر الزيتون',
    ornamentLabel: 'شمسية تذهيب المصحف',
    lightSwatch: '#276352',
    darkSwatch: '#65C2A3',
    lightCanvas: '#EFE7D6',
    darkCanvas: '#17140E',
  },
  {
    id: 'sapphire',
    title: 'لازورد أندلسي',
    subtitle: 'غلاف سماوي ناعم وأزرق أندلسي عميق',
    ornamentLabel: 'أقواس قرطبة المتداخلة',
    lightSwatch: '#1B569C',
    darkSwatch: '#69B0FF',
    lightCanvas: '#DCE8F7',
    darkCanvas: '#0B1322',
  },
  {
    id: 'teal',
    title: 'فيروز المحيط',
    subtitle: 'انتعاش الفيروز الهادئ بتدرجات مائية متناغمة',
    ornamentLabel: 'وردة القاشاني الفيروزية',
    lightSwatch: '#0D7A7E',
    darkSwatch: '#48D1CC',
    lightCanvas: '#D7F0EE',
    darkCanvas: '#091A1C',
  },
  {
    id: 'olive',
    title: 'زيتون المدينة',
    subtitle: 'تدرجات الفستق والزيتون الدافئ مع عسل خفيف',
    ornamentLabel: 'إكليل الزيتون الهندسي',
    lightSwatch: '#536E22',
    darkSwatch: '#A7C957',
    lightCanvas: '#E7EED8',
    darkCanvas: '#12180C',
  },
  {
    id: 'amber',
    title: 'عقيق الصحراء',
    subtitle: 'دفء العسل والعنبر بتناغم ذهبي مشرق',
    ornamentLabel: 'شمسية العقيق الذهبية',
    lightSwatch: '#9E6212',
    darkSwatch: '#F0B64D',
    lightCanvas: '#F4E8D2',
    darkCanvas: '#1A140B',
  },
  {
    id: 'sunset',
    title: 'شفق المرجان',
    subtitle: 'لمسة خوخية دافئة وألوان غروب متناسقة',
    ornamentLabel: 'مقرنصات وهلال الشفق',
    lightSwatch: '#C44D36',
    darkSwatch: '#F28B72',
    lightCanvas: '#F8E3DC',
    darkCanvas: '#1D110F',
  },
  {
    id: 'rose',
    title: 'ورد دمشقي',
    subtitle: 'نسمات وردية ناعمة تغلف الشاشة ببهجة هادئة',
    ornamentLabel: 'الوردة الدمشقية الثمانية',
    lightSwatch: '#BE466E',
    darkSwatch: '#F59BB9',
    lightCanvas: '#F7DFE8',
    darkCanvas: '#1C0F15',
  },
  {
    id: 'plum',
    title: 'لافندر السَحَر',
    subtitle: 'تدرجات الخزامى والأرجواني الهادئ المتزن',
    ornamentLabel: 'مشكاة وفانوس السَحَر',
    lightSwatch: '#664085',
    darkSwatch: '#C29CE3',
    lightCanvas: '#EAE1F5',
    darkCanvas: '#150F1E',
  },
  {
    id: 'burgundy',
    title: 'عنابي ملكي',
    subtitle: 'فخامة العنابي العميق مع خلفية عاجية دافئة',
    ornamentLabel: 'معيّن التذهيب الملكي',
    lightSwatch: '#85203A',
    darkSwatch: '#DE627F',
    lightCanvas: '#F3DDE2',
    darkCanvas: '#1B0D11',
  },
];
