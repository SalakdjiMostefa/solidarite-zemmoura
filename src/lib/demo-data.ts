/**
 * Données d'exemple.
 * - Utilisées par `scripts/seed.ts` pour remplir Firestore.
 * - Utilisées en « mode démo » quand les clés Firebase ne sont pas encore renseignées,
 *   pour que le site soit visible dès le premier `npm run dev`.
 * Aucune photo de personne identifiable : les visuels sont des illustrations SVG.
 */
import type { AssoEvent, ContactSettings, DonationSettings, GlobalStats, ThemeSettings } from './types';
import { DEFAULT_BANK, DEFAULT_CONTACT } from '../config/site';

/** Date relative à aujourd'hui (jours) à une heure donnée */
function d(days: number, hour = 18, minute = 0): number {
  const t = new Date();
  t.setDate(t.getDate() + days);
  t.setHours(hour, minute, 0, 0);
  return t.getTime();
}

export const DEMO_EVENTS: AssoEvent[] = [
  {
    id: 'couffins-ramadan',
    slug: 'couffins-ramadan',
    title: 'Couffins du Ramadan',
    titleAr: 'قفة رمضان',
    type: 'ramadan',
    startAt: d(20, 10),
    endAt: d(50, 18),
    location: 'zemoura',
    address: 'Centre de Zemmoura, Bordj Bou Arréridj',
    description:
      "Chaque année, nous préparons des couffins alimentaires pour les familles les plus modestes de Zemmoura : semoule, huile, sucre, lait, dattes, lentilles…\n\nLa distribution se fait discrètement, en lien avec des bénévoles sur place, pour préserver la dignité de chacun.",
    descriptionAr:
      `نحضّر كل سنة قففاً غذائية لأكثر العائلات حاجةً في زمورة: سميد، زيت، سكر، حليب، تمر، عدس…

يتمّ التوزيع بكل سرّية بالتعاون مع متطوعين في عين المكان، حفاظاً على كرامة الجميع.`,
    coverImage: '/images/evenements/couffins-ramadan.webp',
    coverCredit: 'Youkii Ben — Wikimedia Commons, CC BY-SA 4.0',
    gallery: [],
    donationRef: 'RAMADAN2027',
    volunteersNeeded: true,
    status: 'published',
  },
  {
    id: 'iftar-solidaire-saint-chamond',
    slug: 'iftar-solidaire-saint-chamond',
    title: 'Iftar solidaire à Saint-Chamond',
    titleAr: 'إفطار تضامني',
    type: 'ramadan',
    startAt: d(34, 19, 30),
    endAt: d(34, 23),
    location: 'saint-chamond',
    address: 'Salle municipale, Saint-Chamond',
    description:
      "Un grand repas de rupture du jeûne ouvert à tous, pour partager un moment chaleureux et récolter des fonds pour les couffins de Zemmoura. Chacun peut apporter un plat ou un dessert.",
    descriptionAr: 'مأدبة إفطار كبيرة مفتوحة للجميع، لنتقاسم لحظة دافئة ونجمع التبرّعات لقفف زمورة. يمكن لكل واحد أن يحضر طبقاً أو حلوى.',
    coverImage: '/images/evenements/iftar.webp',
    coverCredit: 'Souad Anane Lesina — Wikimedia Commons, CC BY-SA 3.0',
    gallery: [],
    donationRef: 'IFTAR2027',
    volunteersNeeded: true,
    status: 'published',
  },
  {
    id: 'vetements-aid-el-fitr',
    slug: 'vetements-aid-el-fitr',
    title: "Vêtements de l'Aïd pour les enfants",
    titleAr: 'كسوة العيد',
    type: 'aid-fitr',
    startAt: d(55, 9),
    endAt: d(57, 17),
    location: 'zemoura',
    description:
      "Offrir un habit neuf pour l'Aïd aux enfants de familles en difficulté. Les achats sont faits sur place auprès des commerçants de Zemmoura.",
    descriptionAr: 'تقديم كسوة جديدة للعيد لأطفال العائلات المحتاجة. تتمّ المشتريات في عين المكان لدى تجّار زمورة.',
    coverImage: '/images/evenements/vetements-aid.webp',
    coverCredit: 'Lamri Latreche — Wikimedia Commons, CC BY-SA 4.0',
    gallery: [],
    donationRef: 'AIDFITR2027',
    status: 'published',
  },
  {
    id: 'aid-al-adha-2026',
    slug: 'aid-al-adha-2026',
    title: 'Aïd al-Adha 2026 : offrez un mouton à une famille',
    titleAr: 'عيد الأضحى 2026',
    type: 'aid-kebir',
    startAt: new Date(2026, 4, 1, 9, 0).getTime(),
    endAt: new Date(2026, 4, 29, 18, 0).getTime(),
    location: 'zemoura',
    description:
      `Préparez votre Aïd al-Adha et offrez de la joie en soutenant une famille dans le besoin à Zemmoura.

Pour 250 €, un mouton est acheté sur place et le sacrifice est effectué en votre nom grâce à votre contribution. La viande est ensuite distribuée aux familles qui ne peuvent pas sacrifier.

Renseignements : 06 60 41 97 28 ou 06 79 85 54 31.`,
    descriptionAr: `استعدّوا لعيد الأضحى وأدخلوا الفرحة على عائلة محتاجة في زمورة.

مقابل 250 €، يُشترى كبش في عين المكان وتُذبح الأضحية باسمكم بفضل مساهمتكم، ثم يوزَّع اللحم على العائلات التي لا تستطيع الأضحية.

للاستفسار: 06 60 41 97 28 أو 06 79 85 54 31.`,
    coverImage: '/images/evenements/aid-al-adha.webp',
    coverCredit: 'A. Moqrany — Wikimedia Commons, CC BY-SA 4.0',
    gallery: [],
    donationRef: 'AIDADHA2026',
    report: {
      text: '[Bilan à compléter : nombre de moutons, familles aidées…]',
      textAr: '[حصيلة تُستكمل: عدد الأضاحي، العائلات المستفيدة…]',
      photos: [],
    },
    status: 'published',
  },
  {
    id: 'colis-hiver-zemoura',
    slug: 'colis-hiver-zemoura',
    title: 'Colis hiver : couvertures et chauffage',
    titleAr: 'قافلة الشتاء',
    type: 'action-zemoura',
    startAt: d(-300, 9),
    endAt: d(-295, 17),
    location: 'zemoura',
    description: "L'hiver est rude sur les Hauts Plateaux. Distribution de couvertures, de bouteilles de gaz et de vêtements chauds.",
    descriptionAr: 'الشتاء قاسٍ على الهضاب العليا. توزيع أغطية وقارورات غاز وملابس دافئة.',
    coverImage: '/images/evenements/colis-hiver.webp',
    coverCredit: 'Nacer Ammari — Wikimedia Commons, CC BY-SA 3.0',
    gallery: [],
    donationRef: 'ZEMMOURA-HIVER',
    report: {
      text: '[Bilan à compléter : nombre de couvertures, bouteilles de gaz, familles aidées…]',
      textAr: '[حصيلة تُستكمل: عدد الأغطية وقارورات الغاز والعائلات المستفيدة…]',
      photos: [],
    },
    status: 'published',
  },
  {
    id: 'tournoi-foot-solidaire',
    slug: 'tournoi-foot-solidaire',
    title: 'Tournoi de foot solidaire',
    titleAr: 'دورة كرة القدم التضامنية',
    type: 'sport',
    startAt: new Date(2026, 4, 16, 14, 0).getTime(),
    endAt: new Date(2026, 4, 16, 20, 0).getTime(),
    location: 'autre',
    address: 'Soccer Vallée (foot en salle)',
    description:
      "Un après-midi de foot en salle ouvert à tous : plusieurs équipes, de l'ambiance et du fair-play. Les inscriptions des équipes servent à financer les actions de l'association à Zemmoura.",
    descriptionAr: 'أمسية كرة قدم داخل القاعة مفتوحة للجميع: عدّة فرق، أجواء رائعة وروح رياضية. رسوم تسجيل الفرق تموّل مبادرات الجمعية في زمورة.',
    coverImage: '/images/foot/equipe-tournoi.webp',
    gallery: ['/images/foot/tournoi-groupe-1.webp', '/images/foot/tournoi-groupe-2.webp'],
    report: {
      text: 'Une belle journée avec une quarantaine de joueurs et de bénévoles. Merci à tous les participants et à Soccer Vallée pour l’accueil !',
      textAr: 'يوم جميل جمع حوالي أربعين لاعباً ومتطوعاً. شكراً لكل المشاركين ولقاعة Soccer Vallée على حسن الاستقبال!',
      photos: [],
    },
    status: 'published',
  },
  {
    id: 'fete-fin-annee',
    slug: 'fete-fin-annee',
    title: "Fête de fin d'année de l'association",
    titleAr: 'حفل نهاية السنة',
    type: 'fin-annee',
    startAt: d(-60, 18),
    endAt: d(-60, 23),
    location: 'saint-chamond',
    address: 'Saint-Chamond',
    description: "Soirée conviviale pour remercier bénévoles et donateurs : bilan de l'année, musique et pâtisseries.",
    descriptionAr: 'سهرة ودّية لشكر المتطوعين والمتبرّعين: حصيلة السنة، موسيقى وحلويات.',
    coverImage: '/images/evenements/fin-annee.webp',
    coverCredit: 'Bigmumy — Wikimedia Commons, CC BY-SA 4.0',
    gallery: [],
    report: {
      text: '[Bilan à compléter : nombre de participants, montant récolté…]',
      textAr: '[حصيلة تُستكمل: عدد المشاركين، المبلغ المجموع…]',
      photos: [],
    },
    status: 'published',
  },
];

/** Chiffres clés : à zéro au départ, mis à jour par les admins (Admin → Chiffres) */
export const DEMO_STATS: GlobalStats = {
  raised: 0,
  families: 0,
  couffins: 0,
  volunteers: 0,
};

export const DEMO_DONATION: DonationSettings = {
  holder: DEFAULT_BANK.holder,
  iban: DEFAULT_BANK.iban,
  bic: DEFAULT_BANK.bic,
  amounts: [
    { value: 25, impact: '25 € = un couffin pour une famille', impactAr: '25 € = قفّة لعائلة' },
    { value: 50, impact: "50 € = deux couffins ou l'habit de l'Aïd de deux enfants", impactAr: '50 € = قفّتان أو كسوة العيد لطفلين' },
    { value: 100, impact: '100 € = un mois de denrées de base pour une famille', impactAr: '100 € = مؤونة شهر من المواد الأساسية لعائلة' },
    { value: 250, impact: "250 € = un mouton pour une famille à l'Aïd al-Adha, sacrifié en votre nom", impactAr: '250 € = أضحية العيد لعائلة، تُذبح باسمكم' },
  ],
  taxReceipt: false,
};

export const DEMO_CONTACT: ContactSettings = { ...DEFAULT_CONTACT };

export const DEMO_THEME: ThemeSettings = { mode: 'auto' };
