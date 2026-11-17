export const BUSINESS_PROFILE = {
  name: 'Kalaiselvi Nursery Garden',
  tamilName: 'கலைச்செல்வி நர்சரி கார்டன்',
  address: 'Mailam Road, Kutteripattu, Tindivanam Taluk, Villupuram, Tamil Nadu 604304',
  shortAddress: 'Mailam Road, Kutteripattu – 604304',
  phones: ['9488782488', '8531859560', '8637406716'],
  primaryPhone: '9488782488',
  currency: 'INR',
  currencySymbol: '₹',
};

export const PLANT_CATEGORIES = [
  'Flowering Plants',
  'Fruit Plants',
  'Indoor Plants',
  'Timber Trees',
  'Shrubs & Hedges',
  'Medicinal & Herbal',
  'Pots & Fertilizers',
  'Other',
] as const;

export type PlantCategory = (typeof PLANT_CATEGORIES)[number];

export const ORDER_STATUSES = {
  OPEN: 'OPEN',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const PAYMENT_MODES = {
  CASH: 'CASH',
  UPI: 'UPI',
} as const;
