export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  title: string;
  updated: string;
  intro: LegalBlock[];
  sections: LegalSection[];
};

export type LegalContent = {
  en: LegalDoc;
  fr: LegalDoc;
};

export const p = (text: string): LegalBlock => ({ type: "p", text });
export const list = (items: string[]): LegalBlock => ({ type: "list", items });

export type LegalPageMeta = {
  slug: string;
  en: string;
  fr: string;
};

export const legalPages: LegalPageMeta[] = [
  { slug: "terms", en: "Terms of Service", fr: "Conditions d'utilisation" },
  { slug: "privacy", en: "Privacy Policy", fr: "Politique de confidentialité" },
  { slug: "refunds", en: "Refund & Cancellation Policy", fr: "Politique de remboursement et d'annulation" },
  { slug: "cookies", en: "Cookie Policy", fr: "Politique relative aux témoins" },
  { slug: "acceptable-use", en: "Acceptable Use Policy", fr: "Politique d'utilisation acceptable" },
];

export const LEGAL_UPDATED = "August 8, 2026";
export const LEGAL_UPDATED_FR = "8 août 2026";
