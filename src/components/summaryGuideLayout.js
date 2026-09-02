// The Summary's owl geometry now lives with the rest of the guide placement.
// Kept as a re-export because SummaryBriefingModal and Summary both import from
// here, and a shared name is not worth a two-file rename.
export { SUMMARY_OWL as SUMMARY_GUIDE_OWL_SX } from './guidePlacement';

export const SUMMARY_BRIEFING_Z = 10040;
