// Rwanda VAT is 18% and is INCLUSIVE — menu prices already contain VAT.
// Extract it for the receipt: VAT = total × 18/118.
export const VAT_RATE = 0.18;

export function extractVat(totalInclusive) {
  const vat = Math.round((totalInclusive * VAT_RATE) / (1 + VAT_RATE));
  const subtotal = totalInclusive - vat;
  return { subtotal, vat, total: totalInclusive };
}