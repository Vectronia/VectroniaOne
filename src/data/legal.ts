/**
 * The details the two legal pages need.
 *
 * They are the one thing on this site I cannot write: a wrong Impressum is
 * worse than a missing one. Everything still holding BITTE_AUSFUELLEN is
 * flagged on the page itself, in a banner nobody can miss, so an unfinished
 * Impressum cannot go live unnoticed.
 *
 * The postal address has to be one that could receive a summons — a real
 * street address, not a post box. Anyone working from home either uses that
 * address or rents a business one.
 */
export const TODO = "BITTE_AUSFUELLEN";

export type LegalDetails = {
  /** Full name, as registered. */
  name: string;
  /** Care-of line, where the letterbox carries another name. Empty to omit. */
  careOf: string;
  street: string;
  /** Postcode and town. */
  city: string;
  email: string;
  /** Optional; leave empty to omit the line. */
  phone: string;
  /**
   * VAT identification number under § 27a UStG. Leave empty if the small
   * business rule applies — the page then carries that note instead.
   */
  vatId: string;
  /** Whether § 19 UStG applies, so no VAT is shown on invoices. */
  smallBusiness: boolean;
  /** Who runs the servers, named as the processor in the privacy notice. */
  host: string;
};

export const LEGAL: LegalDetails = {
  name: "Sharon Estelle van Gameren",
  careOf: "c/o Bathrellou",
  street: "Kölnstraße 107",
  city: "53111 Bonn",
  email: "kunst@vectronia-one.de",
  phone: "",
  vatId: "",
  smallBusiness: true,
  host: "Hostinger International Ltd., 61 Lordou Vironos, 6023 Larnaca, Zypern",
};

/** The fields that may not stay unfilled. */
const REQUIRED = ["name", "street", "city", "email"] as const;

export const missingLegalDetails = REQUIRED.filter(
  (field) => !LEGAL[field] || LEGAL[field].includes(TODO),
);
