// How many validated responses a campaign needs before it can be locked.
//
// Compass never emails the team. The leader copies a link and a password and
// sends them himself, so the system cannot know how many people received it.
// Counts are therefore never measured against a number sent: the dashboard
// shows responses received and responses opted out, and nothing else.
//
// Two validated responses is the floor. Leaders are told up front to send the
// survey to five people so that two good answers is a realistic minimum rather
// than the target.
export const MIN_RESPONSES_TO_LOCK = 2;

// What the leader is told to aim for before they buy and when they send the link.
export const RECOMMENDED_TEAM_SIZE = 5;
