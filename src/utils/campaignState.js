const trimText = (value) => String(value || '').trim();

export function normalizeCampaignItems(rawCampaign, options = {}) {
  const {
    maxTraits = 3,
    maxStatementsPerTrait = 5,
    maxReservePerTrait = 5,
  } = options;

  if (!Array.isArray(rawCampaign)) return [];

  const textOf = (statement) => trimText(typeof statement === 'string' ? statement : statement?.text);

  return rawCampaign
    .map((item, index) => {
      const traitName = trimText(item?.traitName || item?.trait || item?.title || `Trait ${index + 1}`);
      const title = trimText(item?.title || traitName);
      const statements = (Array.isArray(item?.statements) ? item.statements : [])
        .map(textOf)
        .filter(Boolean)
        .slice(0, maxStatementsPerTrait);

      if (!traitName || !statements.length) return null;

      // Spare statements, written in the same pass as the five that ship.
      // Dismissing one pulls from here instead of paying for a live rewrite.
      // Anything already on screen is not a spare, so it is filtered out —
      // a "replacement" the leader is currently looking at is not one.
      const shown = new Set(statements.map((s) => s.toLowerCase()));
      const reserve = (Array.isArray(item?.reserve) ? item.reserve : [])
        .map(textOf)
        .filter((s) => s && !shown.has(s.toLowerCase()))
        .slice(0, maxReservePerTrait);

      return {
        ...item,
        trait: traitName,
        traitName,
        title,
        statements,
        reserve,
      };
    })
    .filter(Boolean)
    .slice(0, maxTraits);
}

export function isCampaignReady(campaign, options = {}) {
  const {
    minTraits = 1,
    minStatementsPerTrait = 1,
  } = options;

  if (!Array.isArray(campaign) || campaign.length < minTraits) return false;

  return campaign.every((item) => Array.isArray(item?.statements) && item.statements.length >= minStatementsPerTrait);
}

export function getLeaderDisplayName(campaignMeta) {
  const rawName = trimText(
    campaignMeta?.leaderName
    || campaignMeta?.ownerName
    || campaignMeta?.userInfo?.name
    || campaignMeta?.name
  );

  if (!rawName) return 'your leader';

  const [firstName] = rawName.split(/\s+/).filter(Boolean);
  return firstName || rawName;
}

// Trait selection is the campaign's only input, so choosing a different three
// invalidates whatever campaign is already on disk. The builder reuses a
// cached campaign rather than regenerating on every arrival; without this it
// would hand back statements written for the traits the leader just replaced.
//
// Both places that let a leader commit their three call this instead of
// writing the key directly, so the rule lives in one spot.
export function commitSelectedTraits(traits) {
  const next = (Array.isArray(traits) ? traits : []).map((t) => String(t));

  let previous = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('selectedTraits') || '[]');
    previous = Array.isArray(parsed) ? parsed.map((t) => String(t)) : [];
  } catch { /* treat unreadable as absent */ }

  try {
    localStorage.setItem('selectedTraits', JSON.stringify(next));
  } catch { /* non-fatal */ }

  const unchanged = previous.length === next.length && previous.every((t, i) => t === next[i]);
  if (unchanged) return;

  // Dismissals are indexed against the campaign they were made on, so they go
  // with it rather than outliving it.
  try {
    localStorage.removeItem('currentCampaign');
    localStorage.removeItem('statementDismissals');
  } catch { /* non-fatal */ }
}
