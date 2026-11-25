# DealPulse — React demo

Front-end demo of the DealPulse design: vertical-based login, leads, RFP synopsis, opportunities, compliance, Pre-PO evaluations, P&L decisions and Post-PO.
No backend — all data lives in the browser (localStorage), so every change you make during the demo sticks until you click **Reset demo data**.

## Run it

Needs Node.js 18 or newer.

```bash
npm install
npm run dev        # opens http://localhost:5173
```

To build a static copy you can host anywhere (Netlify, S3, any web server):

```bash
npm run build      # output in dist/
npm run preview    # serve the built copy locally
```

## Demo logins

Pick the vertical on the sign-in screen — email and password are pre-filled. Password for all: **demo@123**

| Vertical | Email | Signs in as | Can do |
|---|---|---|---|
| Sales | sales@dealpulse.demo | Priya S., Sales Manager | Create leads (tag contacts and emails) & opportunities, submit leads for approval, approve leads as Sales Manager (either approver's approval is enough), write RFP synopsis, recommend Yes/No to the P&L Head, put deals on hold, define fallback & reopen |
| P&L Head | plhead@dealpulse.demo | Pushkar B., Sales Head & P&L Head | Approve, send back for more work, or reject leads (with reason + comments); decide Proceed / Reject on deals; define fallback & reopen on-hold deals |
| Solution / Pre-Sales | solution@dealpulse.demo | Vikram N., Pre-Sales Manager | Accept/return synopses (creates the opportunity), approve compliance lines and sign off matrices, create & run PoCs/demos |

The **“Demo · view as”** dropdown in the top bar switches vertical instantly — handy while presenting.
Screens a vertical can't use are hidden from its menu and show “No access” if opened directly.

## Default values

- **New lead** — record type TSP, source Sales Outbound, rating Warm, owner = signed-in user, status New, industry Banking, country India; contact fields pre-filled from a rotating set of 5 sample banks (“Load another sample” cycles them).
- **New opportunity** — stage Qualification (10 %, Pipeline), owner = you, currency INR, close date +90 days, type New Sell, hosting On-premise, tender No, plus a sample deal (ARR + one-time). Converting a lead carries over account, product, source and owner.
- **New RFP synopsis** (from an approved RFP lead) — products and owner from the lead, submission +14 days, EMD Yes, PBG 3 %.
- **New Pre-PO evaluation** — type PoC, approval Pending, start +7 days, 30-day window, owners from the opportunity.
- Stage-specific opportunity fields start with defaults (e.g. SOW done = No) and **Mark stage complete** is blocked until required fields are filled.

## Branding (v14)

DealPulse follows the **NPST Brand Book (Aug 2026)**. All colours and fonts come from the `--idb-*` portal theme tokens at the top of `src/styles.css`:
Core Blue `#01105f` (sidebar, headings, current stage), Core `#214c98` (primary buttons), Bright/Electric Blue (links, focus, charts), Mist Blue `#e2f4fe` (soft backgrounds),
NPST Turquoise `#29b6c4` (the arrow mark) and Golden Yellow `#fcda00` used sparingly (active nav indicator, active tab, login highlight).
Fonts: Aptos for body text, Manrope for headings. The NPST arrow mark appears once, as an accent, next to the DealPulse wordmark.

## What changed in v7 — field specs

Lead and opportunity forms now follow *Lead Information.docx / Lead - Fields.xlsx* and *Opportunity Information.docx / Opportunity Fields.xlsx*.

- **Lead** — sections: Lead Information, Product Description (Product Vertical, Product + multi-select modules, Product TSP 2–4 with modules, Other Remark), SPOC 2 Details, Industry Information, Address Information, Qualification Checks / BANT. Lead-source follow-up fields (Employee / Customer / Partner referral, Event, Others remark). Picklists (lead source, products, modules, industry) come from the sheets.
- **Lead stages** — 1 New · 2 Working · 3 Unqualified · 4 Nurturing · 5 Qualified. “Do they have a need?” = Yes unlocks *Submit for approval*; the lead goes to both the P&L Head and the Sales Manager (Sales login); one approval from either of them moves it to **Qualified** (if neither approves: any Reject → Unqualified, otherwise → back to Sales for more work). *Convert* then creates the opportunity at Stage 1 · Qualification — for non-RFP leads with **no Pre-Sales owner: Sales handles every stage (Qualification → Negotiation) and Pre-Sales / Solution cannot edit it**. Unqualified asks for a DisQualification reason + remark.
- **Opportunity** — sections: Opportunity Information (forecast category, region, updated close / PO dates, project start, first billing, SPOC…), Industry Information (industry → sub industry, merchant categories, account size), Product Description (product, modules, solution type, service model, product owner, hosting), Stage 1–5 sections, Stage 6 Closed Won, Stage 7 Closed Lost, On Hold.
- **Stage 1 · Qualification** — ARR, One Time Fees, calculated Total ARR / Amount (First Year) / TCV, contract duration, billing frequency, tender (Non RFP / RFP / PoC / Empanelment / Proposal), opportunity type (Existing Billing / Farming / Hunting), competition, and **FY27 revenue phasing** (Q1 + monthly Jul 2026–Mar 2027 with quarter totals).
- **Close deal** — Closed Won asks for PO Date, PO Value, Project Start (Actual), First Billing Date/Value; Closed Lost asks for Lost Reason + Remark; On Hold asks for Hold Reason (Internal / External / Both) + Hold Reason Remarks.
- Sub Industry values were not in the sheets; placeholder values are used (e.g. Coop Bank, Small Finance Bank).

## What changed in v6

- **Leads** — “Tag email” button next to Contacts: tag one or more mailbox emails to a lead (optionally fill contact details from the sender). Tagged emails show on the lead.
- **Lead approval** — the P&L Head chooses *Approve*, *More work needed* (lead goes back to Sales with what to fix) or *Reject* (with a reason; lead closes as Unqualified). Comments for every decision are kept in an “Approval comments” list.
- **Opportunities** — *Mark as Won / Mark as Lost* buttons removed. Click any stage in the stage bar to jump to its form; each stage section has **Save** and **Save & proceed to <next stage>**.
- **On hold** — *Put on hold* asks why (reason + details + review date), shown in the banner. On-hold deals get a **Fallback & reopen** panel where Sales and the P&L Head add a fallback plan, suggestion and comment, and can reopen at any stage.
- **Solution** can no longer create opportunities.
- **Finance & Legal** and **CXO / Leadership** logins and dashboards removed.
- **Compliance** — redesigned into **Ongoing projects** and **Completed projects** card sections (completion %, phase, risk, SME sign-offs, last updated, Open workspace). Pre-Sales can sign off a fully approved matrix to move it to Completed.

## Suggested demo script (5 min)

1. Sign in as **Sales** → **+ New lead** → *Tag email* → Save → open it → Mark status as complete → Submit for approval.
2. Switch to **P&L Head** → open the lead → Approval tab → *More work needed* with a comment (or Approve / Reject). Switch back to **Sales** — the dashboard shows the comment; fix and resubmit.
3. On an opportunity, click a stage in the stage bar → fill the form → **Save & proceed**.
4. *Put on hold* with a reason → **Define fallback** → *Save & reopen opportunity*.
5. Switch to **Solution** → Compliance → open a workspace, approve lines, sign off the matrix.

## Project layout

```
src/
  data/verticals.js   roles, menus and permissions per vertical
  data/defaults.js    picklists, stages, and the default-value factories
  data/seed.js        sample banks, leads, opportunities, etc.
  store/              app state (useReducer + localStorage) and auth
  components/         layout, shared UI, lead fields, new-opportunity drawer
  pages/              one file per screen
  router.jsx          tiny hash router (no extra dependency)
```

To connect a real backend later, replace the reducer actions in `src/store/Store.jsx` with API calls — the pages only talk to the store.
