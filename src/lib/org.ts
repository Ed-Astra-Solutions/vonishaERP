// Legal identity of the organisation, as printed on the donation receipt book
// (excel_ref/"Donation receipt .jpeg"). These appear on every printed registration
// fee receipt, so they live in one place — a change to any registration number is a
// one-line edit here.

export const ORG = {
  name: "VONISHA SERVICE FOUNDATION",
  addressLines: [
    "Bhairavi Illam, 208, Laa Regency, 10th Main, APR Kalyana",
    "Mantapa Road, Hongasandra, Begur, Bommanahalli,",
    "Bangalore - 560068",
  ],
  /** 12A & 80G Unique Registration Number — donors claim deduction against this. */
  uniqueRegNo: "AAFCV8564NF20214",
  pan: "AAFCV8564N",
  csrRegNo: "CSR00008514",
  cin: "U85200KA2017NPL101898",
  signatory: "For Vonisha Service Foundation",
} as const;
