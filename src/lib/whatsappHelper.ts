export interface WhatsAppBillParams {
  customerPhone: string;
  customerName: string;
  place: string;
  date: string;
  totalQuantity: number | string;
  rate: number | string;
  totalAmount: number | string;
  advancePaid: number | string;
  balanceAmount: number | string;
  staffName: string;
  staffPhone: string;
}

/**
 * Generates the standardized WhatsApp message for Kalaiselvi Nursery Garden
 * matching the exact business specification.
 */
export function formatWhatsAppBillText(params: WhatsAppBillParams): string {
  const formatNum = (val: number | string) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(n) ? '0.00' : n.toFixed(2);
  };

  return `🌱 *KALAISELVI NURSERY GARDEN*

📍 Mailam Road, Kutteripattu – 604304

━━━━━━━━━━━━━━

👤 Customer Name: ${params.customerName}
📍 Place: ${params.place}
📅 Date: ${params.date}

🌿 Order Details
- Plant Quantity: ${params.totalQuantity}
- Rate: ₹${formatNum(params.rate)}
- Total Amount: ₹${formatNum(params.totalAmount)}

💰 Payment Details
- Advance Paid: ₹${formatNum(params.advancePaid)}
- Balance Amount: ₹${formatNum(params.balanceAmount)}

━━━━━━━━━━━━━━

🧾 Billed By: ${params.staffName}
📞 ${params.staffPhone}

🙏 Thank you for choosing Kalaiselvi Nursery Garden! 🌱`;
}

/**
 * Creates the direct wa.me link with encoded message for single-tap sending.
 */
export function createWhatsAppBillUrl(params: WhatsAppBillParams): string {
  const cleanPhone = params.customerPhone.replace(/\D/g, '');
  const e164Phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const message = formatWhatsAppBillText(params);
  return `https://wa.me/${e164Phone}?text=${encodeURIComponent(message)}`;
}
