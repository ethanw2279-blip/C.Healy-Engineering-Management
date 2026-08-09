// Business details for the app. `name` and `tagline` brand the login screens,
// sidebar, and mobile app; the address/email/phone/vat print on quotes and
// invoices. Edit these to match your company — this is the single source of
// truth, so changing them here updates everywhere.
export const COMPANY = {
  name: 'C.Healy Engineering',
  tagline: 'MOBILE WELDING & FABRICATION',
  // TODO: replace with your real business details — these print on customer
  // quotes and invoices.
  addressLines: ['C.Healy Engineering, Annacurragh, Ireland'],
  email: 'info@chealyengineering.ie',
  phone: '+353 86 277 1717',
  vat: '', // optional VAT/registration number (printed on quotes/invoices)
  // VAT rate applied to quote/invoice line totals. Line prices are treated as
  // net (VAT-exclusive); the document shows Subtotal → VAT → Amount due.
  vatRate: 23,
}
