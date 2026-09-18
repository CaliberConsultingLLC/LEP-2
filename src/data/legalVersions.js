// Which edition of each legal document is live.
//
// Kept apart from the documents themselves because the server reads it too:
// the consent log records the edition a leader was shown, and that has to be
// stamped by the server rather than taken from whatever the browser says it
// displayed. Bump the date here when a document's wording changes — the old
// consent records keep pointing at the edition they agreed to.

export const LEGAL_COMPANY = 'North Star Partners, LLC';

export const LEGAL_VERSIONS = {
  terms: '2026-08-24',
  privacy: '2026-08-24',
  consent: '2026-08-24',
  refunds: '2026-08-24',
};

// The three a leader agrees to when the account is created. The refund policy
// is part of the Terms (section 6) rather than a fourth thing to tick.
export const REQUIRED_CONSENTS = ['terms', 'privacy', 'consent'];
