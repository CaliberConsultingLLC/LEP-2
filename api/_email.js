// One place every Compass email is built and sent.
//
// Before this, the welcome mail hand-rolled its own HTML table inline and
// nothing else could send at all. Six messages later that would have been six
// slightly different letterheads, so the shell lives here and each message
// supplies only what it has to say.
//
// The palette is the product's — navy 10223c, amber-soft f4cea1, sand fbf7f0.
// Mail clients strip <style> blocks and know nothing about CSS variables, so
// every value is inlined literally. That duplication is deliberate and is the
// one place the tokens legitimately cannot reach.

const NAVY = '#10223c';
const AMBER_SOFT = '#f4cea1';
const SAND = '#fbf7f0';
const INK = '#0f1c2e';
const INK_SOFT = '#44566c';
const RULE = '#e8dbc3';
const ORANGE = '#e07a3f';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function appBaseUrl(req) {
  const envBase = String(process.env.APP_BASE_URL || '').trim().replace(/\/+$/, '');
  if (envBase) return envBase;
  const origin = String(req?.headers?.origin || '').trim().replace(/\/+$/, '');
  if (origin) return origin;
  const proto = String(req?.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
}

/**
 * The shared letterhead.
 *
 * `eyebrow` is the small caps line, `title` the serif headline, `body` an
 * array of paragraphs, and `cta` an optional { label, url }. `outro` is the
 * quieter line under the button — where a reset link's expiry belongs.
 */
export function renderEmail({ eyebrow, title, body = [], cta = null, outro = '' }) {
  const paragraphs = body
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.62;color:${INK_SOFT};">${escapeHtml(p)}</p>`
    )
    .join('');

  const button = cta
    ? `<p style="margin:22px 0 0 0;">
         <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${NAVY};color:${AMBER_SOFT};text-decoration:none;padding:13px 26px;border-radius:999px;font-size:14px;font-weight:700;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(cta.label)}</a>
       </p>`
    : '';

  const outroLine = outro
    ? `<p style="margin:18px 0 0 0;font-size:13px;line-height:1.55;color:#8a8272;">${escapeHtml(outro)}</p>`
    : '';

  const html = `
<div style="background:${SAND};padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid ${RULE};border-radius:14px;overflow:hidden;">
    <tr>
      <td style="height:3px;background:linear-gradient(90deg,${AMBER_SOFT},${ORANGE});font-size:0;line-height:0;">&nbsp;</td>
    </tr>
    <tr>
      <td style="padding:30px 34px 8px 34px;">
        <p style="margin:0 0 12px 0;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${ORANGE};">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0 0 16px 0;font-size:25px;line-height:1.18;font-weight:normal;color:${INK};font-family:Georgia,'Times New Roman',serif;">${escapeHtml(title)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0 34px 30px 34px;">
        ${paragraphs}
        ${button}
        ${outroLine}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 34px;border-top:1px solid ${RULE};color:#8a8272;font-size:11px;line-height:1.5;">
        The Compass · Northstar Partners
      </td>
    </tr>
  </table>
</div>`.trim();

  const text = [
    eyebrow.toUpperCase(),
    '',
    title,
    '',
    ...body,
    ...(cta ? ['', `${cta.label}: ${cta.url}`] : []),
    ...(outro ? ['', outro] : []),
    '',
    'The Compass · Northstar Partners',
  ].join('\n');

  return { html, text };
}

/**
 * Sends through Postmark, retrying once on a 5xx.
 *
 * Returns { ok, skipped, status }. `skipped` is the unconfigured case and is
 * not an error — a cron running without a token should say so and move on
 * rather than fail the whole run.
 */
export async function sendEmail({ to, subject, html, text, stream }) {
  const token = String(process.env.POSTMARK_SERVER_TOKEN || '').trim();
  const from = String(process.env.POSTMARK_FROM_EMAIL || '').trim();
  if (!token || !from) return { ok: false, skipped: true, reason: 'email-not-configured' };
  if (!to) return { ok: false, skipped: true, reason: 'no-recipient' };

  const payload = {
    From: from,
    To: to,
    Subject: subject,
    HtmlBody: html,
    TextBody: text,
    MessageStream: stream || process.env.POSTMARK_MESSAGE_STREAM || 'outbound',
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let response;
    try {
      response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': token,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (attempt === 2) return { ok: false, skipped: false, reason: String(err?.message || err) };
      continue;
    }
    if (response.ok) return { ok: true, skipped: false, status: response.status };
    if (response.status < 500 || attempt === 2) {
      const detail = await response.text().catch(() => '');
      return { ok: false, skipped: false, status: response.status, reason: detail.slice(0, 300) };
    }
  }
  return { ok: false, skipped: false, reason: 'unreachable' };
}
