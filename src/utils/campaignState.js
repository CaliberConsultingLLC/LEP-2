const trimText = (value) => String(value || '').trim();

export function normalizeCampaignItems(rawCampaign, options = {}) {
  const {
    maxTraits = 3,
    maxStatementsPerTrait = 5,
  } = options;

  if (!Array.isArray(rawCampaign)) return [];

  return rawCampaign
    .map((item, index) => {
      const traitName = trimText(item?.traitName || item?.trait || item?.title || `Trait ${index + 1}`);
      const title = trimText(item?.title || traitName);
      const statements = (Array.isArray(item?.statements) ? item.statements : [])
        .map((statement) => trimText(typeof statement === 'string' ? statement : statement?.text))
        .filter(Boolean)
        .slice(0, maxStatementsPerTrait);

      if (!traitName || !statements.length) return null;

      return {
        ...item,
        trait: traitName,
        traitName,
        title,
        statements,
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
