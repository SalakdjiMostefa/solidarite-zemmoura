// Vérification rapide du calendrier : npx tsx scripts/test-calendrier.ts
import { fetesMusulmanes, joursFeries, dateHijri, dateLongue, paques } from '../src/lib/calendrier';

const d = new Date();
console.log(dateLongue(d, 'fr'), '|', dateHijri(d, 'fr'));
console.log(dateLongue(d, 'ar'), '|', dateHijri(d, 'ar'));
for (const f of fetesMusulmanes()) console.log('musulman', f.cle, f.date.toDateString(), 'J-' + f.jours);
for (const f of joursFeries().slice(0, 5)) console.log('férié', f.cle, f.date.toDateString(), 'J-' + f.jours);
console.log('Pâques 2027 :', paques(2027).toDateString(), '(attendu : Sun Mar 28 2027)');
