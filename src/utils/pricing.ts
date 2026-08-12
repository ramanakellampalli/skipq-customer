const PLATFORM_RATE    = 0.03;
const CONVENIENCE_RATE = 0.02;
const GST_RATE         = 0.05; // CGST 2.5% + SGST 2.5%

export function calcFees(subtotal: number, gstRegistered: boolean) {
  const platformFee    = subtotal * PLATFORM_RATE;
  const convenienceFee = subtotal * CONVENIENCE_RATE;
  const totalServiceFee = platformFee + convenienceFee;
  const tax            = gstRegistered ? subtotal * GST_RATE : 0;
  const grandTotal     = subtotal + tax + totalServiceFee;
  return { platformFee, convenienceFee, totalServiceFee, tax, grandTotal };
}
