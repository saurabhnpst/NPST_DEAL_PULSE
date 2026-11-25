# Opportunity field mapping

This document maps the **DealPlus frontend Opportunity implementation** (source of truth for UI) to **Opportunity Fields.xlsx** API names. Reference: `Opportunity Information.docx` (stage names only in export). Backend: `backend/apps/opportunity-service` scaffold only (health endpoint).

Generated: 2026-11-20

## 1. Opportunity detail tabs (seven)

| # | Tab | Primary content | Owning capability |
|---|-----|-----------------|-------------------|
| 1 | Details | Collapsible sections: opportunity info, industry, product, stage gates 1–5, closed won/lost, on hold, system info | Opportunity Service (+ Lead for conversion metadata) |
| 2 | Pre-PO evaluation | Evaluation records, deliverables, status stepper | Delivery Service (Pre-PO) |
| 3 | RFP & compliance | RFP synopsis summary + compliance progress (read-mostly) | RFP Service + Compliance Service |
| 4 | Proposal & decision | Proposal uploads/reviews, sales recommendation, P&L decision | Document Service + Approval Service |
| 5 | Commercials & PO | Commercial line items, terms, PO receipt fields | Opportunity Service (commercials) + Document Service (PO file) |
| 6 | Documents | Opportunity document list/upload | Document Service |
| 7 | History | Timeline + manual call/meeting log | Opportunity Service (activity) + cross-cutting audit |

Side panels (not tabs): **Next tasks**, **People**, **Deal tracks** — stored on opportunity record in frontend demo state.

## 2. Stages and UI sections

Open stages (sequential): **Qualification → Needs Analysis → Impact Analysis → Proposal → Negotiation**.

Terminal / non-open stages: **Closed Won**, **Closed Lost**, **No Bid**, **On Hold**.

| Stage (docx / UI) | UI section group | Shown when |
|-------------------|-------------------|------------|
| (n/a) | Opportunity information | Always |
| (n/a) | Industry information | Always |
| (n/a) | Product description | Always |
| Stage 1 | Stage 1 · Qualification | Always (stage 0 fields) |
| Stage 2 | Stage 2 · Needs Analysis | Always |
| Stage 3 | Stage 3 · Impact Analysis | Always |
| Stage 4 | Stage 4 · Proposal | Always |
| Stage 5 | Stage 5 · Negotiation | Always |
| Stage 6 | Stage 6 · Closed Won | Negotiation or Closed Won |
| Stage 7 | Stage 7 · Closed Lost | Closed Lost only |
| (n/a) | On Hold | On Hold or prior hold data |
| (n/a) | System information | Always |

Stage metadata (probability / forecast) from `stageMeta()` in `frontend/src/data/defaults.js`:

| Stage | Probability | Forecast category |
|-------|-------------|-------------------|
| Qualification | 10% | Pipeline |
| Needs Analysis | 25% | Pipeline |
| Impact Analysis | 40% | Pipeline |
| Proposal | 60% | Best Case |
| Negotiation | 80% | Commit |
| Closed Won | 100% | Closed |
| Closed Lost | 0% | Omitted |
| No Bid | 0% | Omitted |
| On Hold | 0% | Omitted |

## 3. User actions

| Action | Where | Behaviour | Permissions (demo verticals) |
|--------|-------|-----------|------------------------------|
| Create opportunity | Pipeline → New opportunity drawer | `ADD_OPP`; optional lead tag converts lead to Qualified | Sales: `createOpp` |
| Convert lead | Lead detail / NewOpportunity `fromLead` | Same as create with `fromLead` id | Sales: `createOpp` |
| Edit details | Opportunity → Details | Local form → `UPDATE_OPP` with history | Open stage + (`editOppEarly` for stages 1–4 OR `editOppLate` for Negotiation) |
| Save | Details (editing) | Persists without stage change | As edit |
| Save & proceed / Proceed | Details stage actions / header | Validates required fields + open stage tasks → `MOVE_STAGE` to next open stage | As edit |
| Put on hold | Header / Close modal outcome | `MOVE_STAGE` to On Hold + holdReason, holdDetails, holdUntil, holdFrom | `editOppLate` on open/On Hold/No Bid closeable stages |
| Close deal | Header modal | Outcomes: Closed Won, Closed Lost, No Bid (+ On Hold in same modal) | `editOppLate` |
| Close Won | Close modal | Requires poDate, poValue>0; may set projectStartActual, firstBillingDate, firstBillingValue, poReceived=Yes, closedValue | As close |
| Close Lost | Close modal | Requires lostReason (+ remark optional in UI) | As close |
| No Bid | Close modal | Stage → No Bid (no extra required fields in UI) | As close |
| Early-close override | Close modal when early-stage tasks incomplete | Requires overrideReason + overrideJustification; sets earlyClose flags | As close |
| Define fallback / reopen | On Hold panel | Updates fallbacks[]; reopen `MOVE_STAGE` to selected open stage | P&L Head + Sales: `fallback` |
| New evaluation | Pre-PO tab | `ADD_EVAL` linked by oppId | `createEval` or edit band |
| Proposal upload / assign reviewer | Proposal tab | Patches reviews[], files[]; may `ADD_REVIEW` | Edit band on opportunity |
| Send to P&L Head | Proposal tab | `RECOMMEND` + decision record | Sales: `recommend` |
| P&L Proceed / Reject | Proposal tab / Decisions page | `DECIDE` | P&L: `decide` |
| Save commercials / PO receipt | Commercials tab | PATCH opportunity lines, terms, poNumber, poDate, poValue, poFile | Edit band |
| Upload document | Documents tab | Appends to files[] | Edit or `createEval` |
| Log call/meeting | History tab | History note via `UPDATE_OPP` | Edit band |
| Tasks / people | Side panel | PATCH tasks[], people[]; Teams notifications (demo) | Edit band |

**Create validation** (`validateOpportunity` in `validators.js`): leadId (if required), name, account, stage, currency, productTsp, closeDate (future), arr > 0.

**Stage progression validation** (`missingFor` in `Opportunity.jsx`): fields with `req: 1` or `reqIf`; checkboxes/numbers must be filled; `mustBe: Yes` for picklists; all open **stage tasks** must be done.

## 4. Calculated and derived fields

| UI label | Frontend key | Formula / rule | Excel analogue |
|----------|--------------|----------------|----------------|
| Amount (First Year) | `_amount` / `dealValue()` | `num(arr) + num(oneTime)` | Amount__c (Formula) |
| Total Contract Value (TCV) | `_tcv` / `tcv()` | `amountFirstYear + year2 + year3 + year4 + year5` | Total_Contract_Value_TCV__c |
| FY27 Q2/Q3/Q4 quarter totals | `fy27Q(v,q)` | Sum of month fields in quarter (Q1 uses fy27Q1 only) | FY27_Q2__c, FY27_Q3__c, FY27_Q4__c (Formula) |
| FY27 total | `fy27Total()` | Sum Q1–Q4 | FY_27__c (Formula) |
| Total ARR (display) | `_totalArr` | `inr(updatedArr || arr)` | Total_ARR__c (Formula) |
| Probability (%) | `_prob` | From current stage | Probability |
| Forecast Category | `_forecast` | From current stage | ForecastCategoryName |
| Product Vertical | `_vertical` | PPAS → EVOK, else TSP | Product_Vertical__c |
| Deal size category | Pipeline list | `category(amountFirstYear)` | NEEDS CONFIRMATION |
| Commercial line total | Commercials tab | `sum(qty * unit price per version column)` | NEEDS CONFIRMATION |

## 5. Conditional visibility and mandatory rules (Details tab)

| Field | Condition | Mandatory |
|-------|-----------|-----------|
| partnerName | partner === 'Yes' | Optional |
| presalesName | presalesInvolved === 'Yes' | Required when visible |
| signDate | contractSigned === 'Yes' | Required when visible |
| criteria | criteriaKnown checkbox true | Optional |
| module2/3/4 | productTsp2/3/4 set and not '—' | Optional |
| subIndustry | Always; options from SUB_INDUSTRIES[industry] | Optional |
| Stage 6 fields | Section visible in Negotiation or Closed Won | poDate, poValue required only on Close Won modal |
| Stage 7 fields | Closed Lost only | lostReason required on Close Lost |
| On Hold fields | On Hold or historical hold | holdReason + holdDetails on Put on hold |

## 6. Details tab — field mapping table

| Field label | Frontend property | Excel API name | Data type | Section | Mandatory | Picklist values | Default | Calculated / conditional |
|-------------|-------------------|----------------|-----------|---------|-----------|-----------------|---------|--------------------------|
| Opportunity Name | `name` | `Name` | Text(120) | Opportunity information | Required for stage progression (Save & proceed) | — | — | — |
| Opportunity Owner | `owner` | `OwnerId` | Lookup(User) | Opportunity information | Required for stage progression (Save & proceed) | — | — | — |
| Account Name | `account` | `AccountId` | Lookup(Account) | Opportunity information | Required for stage progression (Save & proceed) | — | — | — |
| Opportunity Record Type | `_recordType` | `RecordTypeId` | Record Type | Opportunity information | Optional | — | — | Calculated / derived; Read-only; derived from recordType |
| Forecast Category | `_forecast` | `ForecastCategoryName` | Picklist (derived) | Opportunity information | Optional | Omitted; Pipeline; Best Case; Commit; Closed | — | Calculated / derived; Set from stage via stageMeta() |
| Stage | `_stage` | `StageName` | Picklist | Opportunity information | Optional | 1 - Qualification; 2 - Needs Analysis; 3 - Impact Analysis; 4 - Proposal; 5 - Negotiation; 6 - Closed Won; 7 - Closed Lost; 8 - No Bid; 9 - On Hold | — | Calculated / derived; Read-only display of stage |
| Lead Source | `leadSource` | `LeadSource` | Picklist | Opportunity information | Optional | — | Sales Outbound | — |
| Close Date | `closeDate` | `CloseDate` | Date | Opportunity information | Required for stage progression (Save & proceed) | — | Today + 90 days (create) | — |
| Followup Details | `followupDetails` | `Followup_Details__c` | Long Text Area(32768) | Opportunity information | Optional | — | — | — |
| Updated Close Date (if any) | `updatedCloseDate` | `Updated_Close_Date__c` | Date | Opportunity information | Optional | — | — | — |
| Region | `region` | `Region__c` | Picklist | Opportunity information | Optional | Domestic; International | Domestic | — |
| Expected PO Date | `expectedPoDate` | `Expected_PO_Date__c` | Date | Opportunity information | Optional | — | — | — |
| Current Yearly Volume/Transactions | `currentVolume` | `Current_Yearly_Volume_Transactions__c` | Text(255) | Opportunity information | Optional | — | — | — |
| Updated Expected PO Date | `updatedExpectedPoDate` | `Updated_Expected_PO_Date__c` | Date | Opportunity information | Optional | — | — | — |
| Yearly Volume Projection | `yearlyVolumeProjection` | `Yearly_Volume_Projection__c` | Number(18, 0) | Opportunity information | Optional | — | — | — |
| Project Start Date (Expected) | `projectStartExpected` | `Project_Start_Date__c` | Date | Opportunity information | Optional | — | — | — |
| SPOC First Name | `spocFirstName` | `SPOC_First_Name__c` | Text(255) | Opportunity information | Optional | — | — | — |
| First Billing Date(Expected) | `firstBillingExpected` | `First_Billing_Date_Expected__c` | Date | Opportunity information | Optional | — | — | — |
| SPOC Last Name | `spocLastName` | `SPOC_Last_Name__c` | Text(255) | Opportunity information | Optional | — | — | — |
| Probability (%) | `_prob` | `Probability` | Percent | Opportunity information | Optional | — | — | Calculated / derived; Set from stage via stageMeta() |
| Type | `businessType` | `Type` | Picklist | Opportunity information | Optional | Existing Business; New Business | New Business | — |
| Pre-Sales owner | `presales` | `NEEDS CONFIRMATION` | Picklist (demo TEAM/PRESALES) | Opportunity information | Optional | — | Vikram N. (create default) | No Excel field named Pre-Sales owner; presales involvement uses Pre_sales_Product_involved__c; person name uses Pre_Sales_Person_Name__c |
| Territory | `territory` | `NEEDS CONFIRMATION` | Picklist | Opportunity information | Optional | — | South | Territory picklist used in frontend (defaults.js) but not found in Opportunity Fields.xlsx export |
| Converted from lead | `convertedFrom` | `NEEDS CONFIRMATION` | Text/Id | Opportunity information | Optional | — | — | Lead conversion reference; likely LeadId on Opportunity in CRM |
| Industry | `industry` | `Industry__c` | Picklist | Industry information | Optional | — | — | — |
| Sub Industry | `subIndustry` | `Sub_Industry__c` | Picklist | Industry information | Optional | — | — | — |
| Merchant Categories | `merchantCategory` | `Merchant_Categor__c` | Picklist | Industry information | Optional | — | — | — |
| Account Size (L/M/S) | `accountSize` | `Account_Size_L_M_S__c` | Picklist | Industry information | Optional | Large; Medium; Small | — | — |
| Industry Remark | `industryRemark` | `Industry_Remark__c` | Text(255) | Industry information | Optional | — | — | — |
| Product | `productTsp` | `Product_TSP__c` | Picklist | Product description | Required for stage progression (Save & proceed) | — | — | — |
| Product Vertical | `_vertical` | `Product_Vertical__c` | Picklist (derived) | Product description | Optional | — | — | Calculated / derived; PPAS → EVOK else TSP |
| Module | `module` | `NEEDS CONFIRMATION` | Multi-select | Product description | Optional | — | — | UI consolidates product modules; Excel has per-product fields (Module UPI, Module BBPS, IBMB Module, etc.) |
| Product TSP 2 | `productTsp2` | `Product_TSP_2__c` | Picklist | Product description | Optional | — | — | — |
| Module | `module2` | `NEEDS CONFIRMATION` | Multi-select | Product description | Optional | — | — | See module |
| Product TSP 3 | `productTsp3` | `Product_TSP_3__c` | Picklist | Product description | Optional | — | — | — |
| Module | `module3` | `NEEDS CONFIRMATION` | Multi-select | Product description | Optional | — | — | See module |
| Product TSP 4 | `productTsp4` | `Product_TSP_4__c` | Picklist | Product description | Optional | — | — | — |
| Module | `module4` | `NEEDS CONFIRMATION` | Multi-select | Product description | Optional | — | — | See module |
| Product TSP Other Remark | `productRemark` | `Product_TSP_Other_Remark__c` | Text(255) | Product description | Optional | — | — | — |
| Solution Type | `solutionType` | `Solution_Type__c` | Picklist | Product description | Optional | Product; Service; Hybrid | Product | — |
| Hosting | `hosting` | `Hosting__c` | Picklist | Product description | Optional | Cloud; On-premise | On-premise | — |
| Service Model | `serviceModel` | `Service_Model__c` | Picklist | Product description | Optional | SaaS; Licence; Hybrid; Not Applicable | Licence | — |
| Product Owner | `productOwner` | `Product_Owner__c` | Picklist | Product description | Optional | NPST; Third Party; Hybrid | NPST | — |
| Total ARR | `_totalArr` | `Total_ARR__c` | Formula (Number) | Stage 1 · Qualification | Optional | — | — | Calculated / derived; UI shows inr(updatedArr || arr) |
| Annual Recurring Revenue (ARR) | `arr` | `Deal_Size_ARR__c` | Number(18, 0) | Stage 1 · Qualification | Required for stage progression (Save & proceed) | — | — | — |
| One Time Fees | `oneTime` | `Deal_Size_One_time__c` | Number(18, 0) | Stage 1 · Qualification | Required for stage progression (Save & proceed) | — | — | — |
| Amount(First Year) | `_amount` | `Amount__c` | Formula (Number) | Stage 1 · Qualification | Optional | — | — | Calculated / derived; ARR + One Time Fees |
| Total Contract Value (TCV) | `_tcv` | `Total_Contract_Value_TCV__c` | Formula (Number) | Stage 1 · Qualification | Optional | — | — | Calculated / derived; First year + year2..year5 |
| Contract Duration (number of years) | `contractYears` | `Contract_Duration_number_of_years__c` | Picklist | Stage 1 · Qualification | Optional | 1; 2; 3; 4; 5; 6; 7; 8; 9; 10 | 3 | — |
| Billing Frequency/Cycle (Annual/Monthly) | `billingFrequency` | `Billing_Frequency_Cycle_Annual_Monthly__c` | Picklist | Stage 1 · Qualification | Optional | One Time; Monthly; Quarterly; Annual | Annual | — |
| Currency | `currency` | `Currency__c` | Picklist | Stage 1 · Qualification | Required for stage progression (Save & proceed) | INR; USD | INR | — |
| Compelling Event | `compellingEvent` | `Compelling_Event__c` | Text(255) | Stage 1 · Qualification | Required for stage progression (Save & proceed) | — | — | — |
| Tender | `tender` | `Tender__c` | Picklist | Stage 1 · Qualification | Optional | Non RFP; RFP; PoC; Empanelment; Proposal | Non RFP | — |
| Total Deal Size(second year) | `year2` | `Total_Deal_Size_second_year__c` | Number(16, 0) | Stage 1 · Qualification | Optional | — | — | — |
| Total Deal Size(Third year) | `year3` | `Total_Deal_Size_Third_year__c` | Number(18, 0) | Stage 1 · Qualification | Optional | — | — | — |
| Number of Transactions | `transactions` | `Number_of_Transactions__c` | Number(16, 0) | Stage 1 · Qualification | Optional | — | — | — |
| Opportunity Type | `oppType` | `Opportunity_Type__c` | Picklist | Stage 1 · Qualification | Optional | Existing Billing; Farming; Hunting | Hunting | — |
| Is Partner involved? | `partner` | `Is_Partner_involved__c` | Picklist | Stage 1 · Qualification | Optional | Yes; No | No | — |
| Partner Name | `partnerName` | `Partner_Name__c` | Text(255) | Stage 1 · Qualification | Optional | — | — | partner === Yes |
| Competition (multi-select) | `competitors` | `Competions__c` | Picklist (Multi-Select) | Stage 1 · Qualification | Optional | Finacus; FSS; Infrasoft; Justpay; List software Ltd; Mindgate; Mobileware; Razorpay; RS software; Sarvatra; Others | — | — |
| Other Competiton Remarks | `competitionRemarks` | `Competiton_Remarks__c` | Text(255) | Stage 1 · Qualification | Optional | — | — | Excel label: Other Competiton Remarks |
| How do they do today? | `today` | `How_do_they_do_today__c` | Text(255) | Stage 1 · Qualification | Optional | — | — | — |
| Business Implication of doing nothing | `implication` | `Business_Implication_of_doing_nothing__c` | Text(255) | Stage 1 · Qualification | Optional | — | — | — |
| Present pain points | `presentPain` | `Present_pain_points__c` | Text(255) | Stage 1 · Qualification | Optional | — | — | — |
| Pain point? | `painPoint` | `Pain_point__c` | Text(255) | Stage 1 · Qualification | Optional | — | — | — |
| Notes | `notes` | `Notes__c` | Long Text Area(32768) | Stage 1 · Qualification | Optional | — | — | — |
| Next Step | `nextStep` | `NextStep` | Text(255) | Stage 1 · Qualification | Optional | — | — | — |
| FY 27 revenue phasing | `_fy27` | `FY_27__c` | Formula (Number) | Stage 1 · Qualification | Optional | — | — | Calculated / derived; Aggregate FY27 phasing |
| Who is the Economic Buyer? | `economicBuyer` | `Who_is_the_Economic_Buyer__c` | Text(255) | Stage 2 · Needs Analysis | Optional | — | — | — |
| Is the Champion identified? | `champion` | `Is_the_Champion_identified__c` | Checkbox | Stage 2 · Needs Analysis | Optional | — | — | Excel label includes trailing space: "Is the Champion identified ?" |
| NDA? | `nda` | `NDA__c` | Picklist | Stage 2 · Needs Analysis | Optional | — | — | UI uses checkbox; Excel is Picklist |
| Champion engaged and validated? | `championOk` | `Champion_engaged_and_validated__c` | Checkbox | Stage 2 · Needs Analysis | Optional | — | — | — |
| Competitive strategy? | `strategy` | `Competition_strategy__c` | Text(255) | Stage 2 · Needs Analysis | Optional | — | — | — |
| Confirm Requirements/Doc Received? | `reqReceived` | `Confirm_Requirements_Doc_Received__c` | Picklist | Stage 2 · Needs Analysis | Required for stage progression (Save & proceed); Must equal 'Yes' | Yes; No | — | — |
| Pre sales / Product involved | `presalesInvolved` | `Pre_sales_Product_involved__c` | Picklist | Stage 2 · Needs Analysis | Optional | Yes; No | — | — |
| Pre sales Person Name | `presalesName` | `Pre_Sales_Person_Name__c` | Text(255) | Stage 2 · Needs Analysis | Required when visible (reqIf) | — | — | presalesInvolved === Yes |
| Economic Buyer Aligned? | `ebAligned` | `Economic_Buyer_Aligned__c` | Text(255) | Stage 3 · Impact Analysis | Optional | — | — | — |
| What is Success criteria? | `success` | `What_is_Success_criteria__c` | Text(255) | Stage 3 · Impact Analysis | Optional | — | — | — |
| Date when we met him? | `ebMet` | `Date_when_we_met_him__c` | Date | Stage 3 · Impact Analysis | Optional | — | — | — |
| Is there going to POC? | `poc` | `Is_there_is_going_to_POC__c` | Checkbox | Stage 3 · Impact Analysis | Optional | — | — | Excel label differs slightly |
| Demo/ POC/Deep Engagement Done? | `demoDone` | `Demo_POC_Deep_Engagement_Done__c` | Checkbox | Stage 3 · Impact Analysis | Required for stage progression (Save & proceed) | — | — | Label in Excel: Demo / POC / Deep Engagement Done? |
| SOW done? | `sow` | `SOW_done__c` | Picklist | Stage 3 · Impact Analysis | Required for stage progression (Save & proceed); Must equal 'Yes' | Yes; No | — | — |
| Proposal Submission date? | `proposalDate` | `Submission_date__c` | Date | Stage 4 · Proposal | Required for stage progression (Save & proceed) | — | — | Excel: Submission date? |
| Is Decision Criteria known? | `criteriaKnown` | `Is_Decision_Criteria_known__c` | Checkbox | Stage 4 · Proposal | Optional | — | — | — |
| Latest Followup Date | `latestFollowupDate` | `Latest_Followup_Date__c` | Date | Stage 4 · Proposal | Optional | — | — | — |
| Is Decision Criteria known reason | `criteria` | `Is_Decision_Criteria_known_reason__c` | Text(255) | Stage 4 · Proposal | Optional | — | — | criteriaKnown checked |
| Contract shared? | `contractShared` | `Contract_shared__c` | Picklist | Stage 5 · Negotiation | Optional | Yes; No | — | — |
| Contract Signed ? | `contractSigned` | `Contract_Signed__c` | Picklist | Stage 5 · Negotiation | Optional | Yes; No | — | — |
| Discounted asked? | `discount` | `Discounted_asked__c` | Text(255) | Stage 5 · Negotiation | Optional | — | — | — |
| Date of signing the contract? | `signDate` | `Date_of_signing_the_contract__c` | Date | Stage 5 · Negotiation | Required when visible (reqIf) | — | — | contractSigned === Yes |
| Commercials | `commercials` | `Commercials__c` | Picklist | Stage 5 · Negotiation | Optional | Yes; No | — | — |
| Bank Interview | `bankInterview` | `Bank_Interview__c` | Picklist | Stage 5 · Negotiation | Optional | Yes; No | — | — |
| Documentation | `documentation` | `Documentation__c` | Picklist | Stage 5 · Negotiation | Optional | — | — | — |
| Bank Approval | `bankApproval` | `Bank_Approval__c` | Picklist | Stage 5 · Negotiation | Optional | Yes; No | — | — |
| UAT Agreement | `uatAgreement` | `UAT_Agreement__c` | Picklist | Stage 5 · Negotiation | Optional | Yes; No | — | — |
| PO Received | `poReceived` | `PO_Received__c` | Picklist | Stage 5 · Negotiation | Optional | Yes; No | — | — |
| Project Start Date (Actual) | `projectStartActual` | `Project_Start_Date_Actual__c` | Date | Stage 6 · Closed Won | Optional | — | — | — |
| First Billing Date | `firstBillingDate` | `First_Billing_Date__c` | Date | Stage 6 · Closed Won | Optional | — | — | — |
| PO Date | `poDate` | `PO_Date__c` | Date | Stage 6 · Closed Won | Required on Close Won | — | — | — |
| First Billing Value | `firstBillingValue` | `First_Billing_Value__c` | Number(18, 0) | Stage 6 · Closed Won | Optional | — | — | — |
| PO Value | `poValue` | `PO_Value__c` | Number(18, 0) | Stage 6 · Closed Won | Required on Close Won | — | — | — |
| Lost Reason | `lostReason` | `Lost_Reason__c` | Picklist | Stage 7 · Closed Lost | Required on Close Lost | Change in Priorities; Competition; Customer went cold; Price; Product Fitment; Project Cancelled; Technically Not Qualified; Others | — | — |
| Lost Reason Remark | `lostReasonRemark` | `Lost_Reason_Remark__c` | Text(255) | Stage 7 · Closed Lost | Optional | — | — | — |
| Hold Reason | `holdReason` | `Hold_Reason__c` | Picklist | On Hold | Required on Put on hold | --None--; Internal; External; Both(Internal & External) | — | — |
| Hold Reason Remarks | `holdDetails` | `Hold_Reason_Remarks__c` | Long Text | On Hold | Required on Put on hold | — | — | Excel: Hold Reason Remarks |
| Review hold by | `holdUntil` | `NEEDS CONFIRMATION` | Date | On Hold | Optional | — | — | Review hold by date; no matching Excel label found |

### FY27 revenue phasing (sub-fields)

| Month / quarter label | Frontend property | Excel API name | Data type | Section | Mandatory | Default | Calculated |
|------------------------|-------------------|----------------|-----------|---------|-----------|---------|------------|
| FY27 Q1 (direct entry) | `fy27Q1` | `NEEDS CONFIRMATION` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q1 input; Excel has FY27_Q1_Updated__c / FY27_Q1_Old__c only |
| Jul 2026 | `fy27Jul` | `FY27_July__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Aug 2026 | `fy27Aug` | `FY27_August__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Sep 2026 | `fy27Sep` | `FY27_September__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Oct 2026 | `fy27Oct` | `FY27_Oct__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Nov 2026 | `fy27Nov` | `FY27_Nov__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Dec 2026 | `fy27Dec` | `FY27_Dec__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Jan 2027 | `fy27Jan` | `FY27_Jan__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Feb 2027 | `fy27Feb` | `FY27_Feb__c` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | Q2–Q4 quarter totals calculated |
| Mar 2027 | `fy27Mar` | `NEEDS CONFIRMATION` | Number(18,0) | Stage 1 · Qualification | Optional | 0 (demo phasing in `withExtras`) | No matching month field in Excel export |

## 7. Other UI surfaces (non-Details tab)

### 7.1 New opportunity drawer (`NewOpportunity.jsx`)

Subset of Details fields plus **leadId** (tag lead). Same picklists/defaults as create flow. Does not expose full stage sections.

### 7.2 Pipeline list (`Pipeline.jsx`)

Columns: id, name, account, stage, probability, forecast, deal size (`dealValue`), category, close date, owner, presales — derived from opportunity record + `stageMeta`.

### 7.3 Pre-PO evaluation (Delivery Service)

| Field label | Store key | Excel in Opportunity sheet | Mandatory in UI |
|-------------|-----------|----------------------------|-----------------|
| Evaluation name | `evaluations[].name` | `NEEDS CONFIRMATION` | Yes |
| Evaluation type | `evaluations[].type` | `NEEDS CONFIRMATION` | Yes (PoC/Demo/Pilot/Customization) |
| Status | `evaluations[].status` | `NEEDS CONFIRMATION` | Yes |
| Approval status | `evaluations[].approval` | `NEEDS CONFIRMATION` | No |
| Sales owner | `evaluations[].sales` | `NEEDS CONFIRMATION` | Yes |
| Solution owner | `evaluations[].solution` | `NEEDS CONFIRMATION` | No |
| Technical owner | `evaluations[].tech` | `NEEDS CONFIRMATION` | Yes |
| Start date | `evaluations[].start` | `NEEDS CONFIRMATION` | Yes |
| Target completion | `evaluations[].target` | `NEEDS CONFIRMATION` | Yes |
| Submitted to bank | `evaluations[].submitted` | `NEEDS CONFIRMATION` | No |
| Expected PO date | `evaluations[].expectedPo` | `Expected_PO_Date__c (on opp)` | No |
| Effort before PO | `evaluations[].effort` | `NEEDS CONFIRMATION` | No |
| Cost before PO | `evaluations[].cost` | `NEEDS CONFIRMATION` | No |
| Scope | `evaluations[].scope` | `NEEDS CONFIRMATION` | Yes |
| Next action | `evaluations[].next` | `NextStep (opp)` | No |
| Deliverable title/owner/due/effort/status | `deliverables[]` | `NEEDS CONFIRMATION` | Title required to add |

### 7.4 RFP synopsis display (RFP Service)

Read-only keys from `state.synopses` / `opp.rfp`: ref, submitted, opening, emd, pbg, owner, scope.

### 7.5 Compliance summary (Compliance Service)

Counts from `state.compliance` filtered by oppId — not opportunity fields.

### 7.6 Proposal & decision

| Field | Key | Service |
|-------|-----|---------|
| Document review rows | `opportunity.reviews[]` | Document + Approval |
| Sales recommendation | `recDraft.* + decision via RECOMMEND` | Approval Service |
| P&L decision | `state.decisions[]` | Approval Service |

### 7.7 Commercials & PO

| Field label | Frontend property | Excel API | Notes |
|-------------|-------------------|-----------|-------|
| Commercial line item | `lines[].t` | `NEEDS CONFIRMATION` | Not in Opportunity Fields.xlsx as line object |
| Quantity | `lines[].q` | `NEEDS CONFIRMATION` |  |
| Unit prices per version | `lines[].p[]` | `NEEDS CONFIRMATION` | Version labels in versions[] |
| Licence model | `licence` | `NEEDS CONFIRMATION` | UI picklist: Perpetual, Subscription, Transaction-based |
| Payment milestones | `milestones` | `NEEDS CONFIRMATION` | 40/40/20, etc. |
| AMC term | `amcTerm` | `NEEDS CONFIRMATION` | 3/5/7 years |
| PO number | `poNumber` | `NEEDS CONFIRMATION` | Separate from PO_Value__c / PO date fields |
| PO file name | `poFile` | `NEEDS CONFIRMATION` | Binary via Document Service |

### 7.8 Documents, tasks, people, fallback, override

| Concept | Frontend property | Owner |
|---------|-------------------|-------|
| Document metadata | `files[]` | Document Service |
| Stage/on-demand tasks | `tasks[]` | Opportunity Service (or Task/Notification) |
| Deal team people | `people[]` | Opportunity Service / Lead contacts |
| On-hold fallback entries | `fallbacks[]` | Opportunity Service |
| Early close override | `earlyClose, overrideReason, overrideJustification` | Opportunity Service |
| Audit trail | `history[]` | Opportunity Service |

## 8. Picklists and multi-select options (frontend source)

Authoritative option lists live in `frontend/src/data/defaults.js`, `merchantCategories.js`, and product `MODULES` map. Excel picklist sheet aligns for many CRM fields; where they differ, frontend demo values apply.

| UI field | Frontend source constant | Excel picklist sheet |
|----------|-------------------------|----------------------|
| Lead Source | `LEAD_SOURCES` | NEEDS CONFIRMATION — not in Opportunity picklist export subset |
| Region | `REGIONS` | Region |
| Territory | `TERRITORIES` | NEEDS CONFIRMATION (not in xlsx) |
| Opportunity Type | `OPP_TYPES` | Opportunity Type |
| Type (business) | `BUSINESS_TYPES` | NEEDS CONFIRMATION |
| Tender | `TENDER_TYPES` | Tender |
| Industry | `INDUSTRIES` | NEEDS CONFIRMATION |
| Sub Industry | `SUB_INDUSTRIES map` | Sub Industry (controlling: Industry) |
| Merchant Categories | `MERCHANT_CATEGORIES` | Merchant Categories |
| Account Size | `ACCOUNT_SIZES` | Account Size (L/M/S) |
| Product / Product TSP 2–4 | `PRODUCTS / PRODUCTS_2_4` | Product / Product TSP 2 (partial) |
| Module | `MODULES[product]` | Per-product module picklists in Excel (UPI Module, etc.) |
| Solution Type | `SOLUTION_TYPES` | Solution Type |
| Hosting | `HOSTING` | Hosting |
| Service Model | `SERVICE_MODELS` | Service Model |
| Product Owner | `PRODUCT_OWNERS` | Product Owner |
| Currency | `INR, USD` | Currency |
| Contract years | `CONTRACT_YEARS` | Contract Duration (number of years) |
| Billing frequency | `BILLING_FREQUENCIES` | Billing Frequency/Cycle (Annual/Monthly) |
| Partner involved | `YES_NO` | Is Partner involved? |
| Competition | `COMPETITORS` | Competition |
| Yes/No stage gates | `YES_NO` | Multiple fields (SOW, NDA, etc.) |
| Lost reason | `LOST_REASONS` | Lost Reason |
| Hold reason | `HOLD_REASONS` | Hold Reason |
| Override reason | `OVERRIDE_REASONS` | NEEDS CONFIRMATION |
| Stage | `OPEN_STAGES + terminal` | Stage |
| Negotiation picklists | `YES_NO with blank` | Commercials, Bank Approval, PO Received, etc. |

## 9. Excel fields not represented in the Opportunity frontend

The export contains **200** opportunity fields. The UI implements the stage-gate subset above plus tab-specific structures. The following **Excel field groups** have **no dedicated frontend control** identified (non-exhaustive; NEEDS CONFIRMATION where product-specific module splits may partially cover):

- Amount (standard Amount field)
- Budget Confirmed
- Competitor 1/2/3 (text)
- Contract lookup
- Country
- DateFormula
- Days Since Created
- Description
- Discovery Completed
- Document Upload checkbox
- Expected Qty of Soundbox
- Expected Quantity of QR
- Expected Revenue
- FY26 Q4 / FY27 Updated* / Old* revenue tracking fields
- Per-product module fields (Module UPI, Module BBPS 1–4, Banking Super App Module, BBPS Corporate, etc.)
- ROI Analysis Completed
- RFP Process
- Sub Products
- Synced Quote
- Tender or Not Remarks
- Updated Amount/ARR/TCV/Deal size year fields (Updated_* )
- Total Deal Size(Fourth/Fifth year)
- Total Deal Size(1st Year)
- Who?
- Standard Salesforce system fields (CreatedById, LastModifiedById, LastSyncTime, etc.)

Full Excel inventory: `Opportunity Fields.xlsx` → sheet **Fields**. Compare programmatically during API design.

## 10. Microservice ownership (from frontend boundaries)

| Capability | Microservice | Frontend touchpoints |
|------------|--------------|------------------------|
| Opportunity CRUD, stage moves, hold/reopen/close, revenue fields, tasks, people, history, commercials header fields | Opportunity Service | Opportunity.jsx, Pipeline, Store MOVE_STAGE/ADD_OPP |
| Lead conversion, account/SPOC carry-over | Lead Service | NewOpportunity fromLead, ACCEPT_SYNOPSIS |
| RFP synopsis & tender metadata | RFP Service | RfpTab, Lead/RFP pages |
| Compliance matrix | Compliance Service | RfpTab summary, Compliance page |
| Pre-PO evaluations & deliverables | Delivery Service | PrePoTab, PrePO page, ADD_EVAL |
| P&L recommendation & decision | Approval Service | DecisionTab, Decisions page, RECOMMEND/DECIDE |
| Document upload/storage/versions | Document Service | DocumentsTab, proposal upload, PO attach |
| Internal review queue | Approval Service (+ Notification) | ADD_REVIEW, Teams demo messages |
| Post-PO delivery | Delivery Service | Post-PO nav (linked won deals) |
| AuthZ / roles | Auth Service | verticals.js permissions |
| Notifications (Teams/email) | Notification Service | Teams.jsx simulation |

## 11. Opportunity Service backend scaffold

Current code under `backend/apps/opportunity-service`: `main.ts`, `app.module.ts`, `health.controller.ts` (`GET /api/v1/health`) only. Folders `dto/`, `entities/`, `stages/`, `revenue/`, `products/`, `owners/`, `fallback/` are placeholders (`.gitkeep`).

Proposed REST surface (not implemented): see `docs/api/api-catalog.md` → Opportunities section.

## 12. Open mapping items (NEEDS CONFIRMATION)

1. Map `presales` (Pre-Sales owner) to correct CRM field vs `Pre_sales_Product_involved__c` / `Pre_Sales_Person_Name__c`
2. Territory field API name in Salesforce/export
3. Consolidated `module` multi-select vs per-product module fields in Excel
4. Review hold by (`holdUntil`) date field
5. Converted from lead (`convertedFrom` / leadId)
6. Commercial line-item model vs Excel
7. FY27 Q1 direct entry and March 2027 month field API names
8. Whether No Bid requires reason fields (UI: none)
9. NDA UI checkbox vs Excel `NDA__c` picklist type
10. `leadSource` and industry picklist value parity between frontend `defaults.js` and Excel picklist export
