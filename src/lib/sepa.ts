/**
 * Génération du contenu d'un QR code de virement SEPA (norme EPC069-12).
 * Lisible par la plupart des applis bancaires européennes.
 */
export interface EpcInput {
  name: string;
  iban: string;
  bic?: string;
  amount?: number;
  reference?: string;
}

export const cleanIban = (iban: string) => iban.replace(/\s+/g, '').toUpperCase();

/** Format lisible : groupes de 4 caractères */
export const formatIban = (iban: string) => cleanIban(iban).replace(/(.{4})/g, '$1 ').trim();

export function epcPayload({ name, iban, bic = '', amount, reference = '' }: EpcInput): string {
  const amt = amount && amount > 0 ? `EUR${Math.min(amount, 999999999.99).toFixed(2)}` : '';
  return [
    'BCD', // Service Tag
    '002', // Version
    '1', // Encodage UTF-8
    'SCT', // SEPA Credit Transfer
    bic.replace(/\s+/g, '').toUpperCase(),
    name.slice(0, 70),
    cleanIban(iban),
    amt,
    '', // Purpose
    '', // Référence structurée
    reference.slice(0, 140), // Référence libre (communication)
  ].join('\n');
}
