# What the Compass sends, and when

Every message the product can put in someone's inbox. Written down because the
set was not recorded anywhere, and "is the mail working" is not answerable
without knowing what mail there is.

All of it goes through Postmark via `sendEmail` in [`api/_email.js`](api/_email.js),
on one letterhead built by `renderEmail` in the same file.

## The set

| # | Message | Endpoint | Trigger | To | Subject |
|---|---------|----------|---------|-----|---------|
| 1 | Welcome | `POST /api/send-welcome-email` | Account creation, called by the client with the new user's ID token | The new leader | Welcome to the Compass |
| 2 | Password reset | `POST /api/send-password-reset` | The leader asks for one from `/sign-in` | The address given, whether or not it exists | Reset your Compass password |
| 3 | Nudge | `POST /api/cron-campaign-mail` | Daily cron, `0 15 * * *`, on days 5, 7 and 10 of an open window | The leader, not the team | *n* of *m* have answered — or "Your Compass survey is still waiting" at zero |
| 4 | Everyone answered | same cron | The same daily scan, when responses reach the declared invite count | The leader | Your Compass reading is ready |

That is the whole set. Four messages, three endpoints.

## What does not send, deliberately

- **The team invitation.** The leader sends the link themselves. That is the
  anonymity promise: the product never learns who was asked, so it cannot
  write to them. `SelfAssessmentChapter` says so on the page — *"You send the
  invite yourself so the answers stay anonymous."*
- **The receipt.** Stripe issues it from the customer's own payment. Confirm
  receipts are switched on in the Stripe dashboard; nothing in this repo
  sends one.
- **Anything to a respondent.** They arrive by link, answer, and leave. We
  hold no address for them.

## Before any of it can be verified

Both are Vercel environment variables, and both are set once.

- **`CRON_SECRET`** — the cron endpoint refuses every caller, Vercel included,
  until this exists. Nothing scheduled has ever sent. Messages 3 and 4 are
  blocked entirely behind it.
- **`APP_BASE_URL`** — every link in every letter is built from it. Without
  it the value falls back to the request's own host, and a cron invocation's
  host is the deployment that happened to run it. Unset, the nudges can point
  a customer at a preview URL rather than at the product.

`POSTMARK_SERVER_TOKEN` and `POSTMARK_FROM_EMAIL` are already set on Vercel.
Note that `sendEmail` treats either one missing as *skipped* rather than
failed — it returns quietly instead of throwing, so an unconfigured
environment looks like silence rather than an error.

## Verifying, in order

1. Set `CRON_SECRET` and `APP_BASE_URL`, then redeploy.
2. **Welcome** — create an account on staging. This is the one that needs no
   cron and no secret.
3. **Reset** — ask for a reset from `/sign-in`. Check both that it arrives and
   that an address with no account gets the same response on screen; the
   endpoint answers identically either way so the form cannot be used to
   enumerate customers.
4. **Cron** — Vercel → Cron Jobs → run `/api/cron-campaign-mail` by hand. A
   200 with a JSON summary rather than a 401. The scan only considers leaders
   who have declared how many invites they sent, on a window that is still
   open, so a database without one correctly reports `scanned: 0`.
5. **Nudge and reading-ready** — need a campaign with a declared invite count
   and a start date 5 or more days old. Each send is recorded on the response
   document under `campaignMail`, so a second run of the same day cannot send
   twice — clear that field to re-test.

## Content

All four have their words. What they do not have is a read-through: nothing
here has been seen in an inbox, only in code. Worth doing before launch, on
both a desktop and a phone client.

Two links to check while reading: the nudge goes to `/dashboard?tab=today` and
the reading-ready to `/dashboard?tab=signal`. If the dashboard rework renames
Signal to Sentiment, those query values move with it — a link in a sent email
cannot be edited afterwards.
