# 20A_TALLY_AI_FORM_BUILD_INSTRUCTIONS.md

Version: 4.0  
Status: Production Draft

---

# Purpose

This file contains the exact instructions to use with Tally AI when creating the three founder forms for the Founder Intelligence Platform.

The forms are:

1. Startup Snapshot
2. Startup Intelligence
3. Decision Review

Tally is responsible only for collecting founder input, processing Stripe payment for the paid form, handling file upload for the review form, and sending webhooks to the Vercel backend.

Tally does not calculate scores, generate reports, run AI analysis, or store business logic.

---

# Global Form Rules

Use these rules for all three Tally forms.

## Tone

Professional, clear, calm, founder-friendly.

Avoid:

- hype
- urgency tactics
- vague motivational language
- excessive explanation
- consultant jargon

## Field Naming

Use clear field names. Backend field names should use snake_case.

Examples:

- startup_name
- founder_email
- country
- sector
- current_stage
- monthly_revenue_band
- paying_customers_band
- primary_objective
- biggest_constraint

## Hidden Fields

Add these hidden fields to every form:

- assessment_version
- form_type
- source
- language
- utm_source
- utm_medium
- utm_campaign

Recommended default values:

- assessment_version = v4
- language = en

Form-specific values:

- Startup Snapshot: form_type = snapshot
- Startup Intelligence: form_type = intelligence
- Decision Review: form_type = decision_review

## Webhooks

Configure each form to send a webhook to Vercel.

Use placeholder URLs until the production domain is known.

Snapshot webhook:

https://YOUR_DOMAIN.com/api/webhooks/tally/snapshot

Startup Intelligence webhook:

https://YOUR_DOMAIN.com/api/webhooks/tally/intelligence

Decision Review webhook:

https://YOUR_DOMAIN.com/api/webhooks/tally/review

---

# Form 1 — Startup Snapshot

## Business Objective

Help the founder decide whether additional investment of time, money, or analysis is worthwhile.

Expected completion time: 5–8 minutes.

## Tally AI Prompt

Paste this into Tally AI:

```text
Create a professional startup assessment form called "Startup Snapshot".

The form is for early-stage technology founders in Romania and Central & Eastern Europe.

The purpose is to collect enough information to generate a short founder decision brief that identifies current position, primary constraint, missing evidence, confidence, and one highest-leverage next action.

Tone should be professional, concise, calm, and founder-friendly. Avoid hype, sales language, urgency, motivational language, and consultant jargon.

Add this introduction:

"Answer a few structured questions about your startup. You will receive a short decision brief showing your current position, primary constraint, missing evidence, confidence level, and the most useful next action. This is not investment, legal, tax, accounting, or financial advice."

Create these fields:

1. Startup name
Type: short text
Required: yes
Internal name: startup_name

2. Founder email
Type: email
Required: yes
Internal name: founder_email

3. Country
Type: dropdown
Required: yes
Options: Romania, Bulgaria, Hungary, Poland, Czech Republic, Slovakia, Slovenia, Croatia, Serbia, Moldova, Ukraine, Estonia, Latvia, Lithuania, Other Europe, Other
Internal name: country

4. Sector
Type: dropdown
Required: yes
Options: B2B SaaS, FinTech, HealthTech, EdTech, AI / Automation, Marketplace, Developer Tools, Cybersecurity, ClimateTech, E-commerce, Consumer App, PropTech, HRTech, Logistics, Other
Internal name: sector

5. Current stage
Type: dropdown
Required: yes
Options: Idea, Problem validation, Prototype, MVP built, First users, First paying customers, Early recurring revenue, Preparing to raise, Already funded
Internal name: current_stage

6. Describe your startup in one sentence
Type: long text
Required: yes
Help text: What do you do, for whom, and what problem do you solve?
Internal name: one_sentence_description

7. Target customer
Type: short text
Required: yes
Internal name: target_customer

8. Monthly revenue
Type: dropdown
Required: yes
Options: No revenue, €1–€500, €501–€2,000, €2,001–€5,000, €5,001–€10,000, €10,001–€25,000, €25,001+, Prefer not to say
Internal name: monthly_revenue_band

9. Paying customers
Type: dropdown
Required: yes
Options: 0, 1–3, 4–10, 11–25, 26–50, 51–100, 100+, Prefer not to say
Internal name: paying_customers_band

10. Team size
Type: dropdown
Required: yes
Options: Solo founder, 2 founders, 3–5 people, 6–10 people, 11–25 people, 25+
Internal name: team_size_band

11. Is there a technical founder?
Type: multiple choice
Required: yes
Options: Yes, No, Not sure
Internal name: has_technical_founder

12. Is there a commercial or sales-oriented founder?
Type: multiple choice
Required: yes
Options: Yes, No, Not sure
Internal name: has_commercial_founder

13. Primary objective for the next 6 months
Type: dropdown
Required: yes
Options: Validate the problem, Launch MVP, Get first users, Get first paying customers, Grow revenue, Prepare fundraising, Hire, Expand to another market, Improve operations, Change positioning, Not sure
Internal name: primary_objective

14. Biggest current constraint
Type: dropdown
Required: yes
Options: Unclear customer demand, Weak product, Weak sales, Limited funding, Weak pricing evidence, Hiring capacity, Too many priorities, Fundraising readiness, Competition, Regulatory uncertainty, Not sure, Other
Internal name: biggest_constraint

15. What are you considering spending money or time on next?
Type: checkbox
Required: yes
Options: Product development, Sales, Marketing, Hiring, Fundraising support, Market research, Pricing, Partnerships, Expansion, Legal / accounting, Not sure
Internal name: planned_next_investment

16. Anything important we should know?
Type: long text
Required: no
Internal name: additional_context

Add hidden fields: assessment_version, form_type, source, language, utm_source, utm_medium, utm_campaign.

Set defaults:
assessment_version = v4
form_type = snapshot
language = en

End message:
"Your Startup Snapshot has been submitted. If the email is valid, your decision brief will be generated and sent to you."
```

---

# Form 2 — Startup Intelligence

## Business Objective

Collect enough structured information to generate the paid Founder Intelligence Brief.

This form includes payment through Tally's native Stripe payment block.

Expected completion time: 10–15 minutes.

Price: €49.

## Tally AI Prompt

Paste this into Tally AI:

```text
Create a professional paid startup assessment form called "Startup Intelligence".

The form is for early-stage technology founders in Romania and Central & Eastern Europe.

The purpose is to collect structured founder information and payment, then trigger generation of a benchmark-informed Founder Intelligence Brief.

Tone should be professional, concise, calm, and founder-friendly. Avoid hype, sales language, urgency, motivational language, and consultant jargon.

Add this introduction:

"Answer structured questions about your startup. After payment, you will receive a Founder Intelligence Brief covering current position, benchmark context, transparent valuation logic, primary constraint, investor perspective, recommendations, roadmap, confidence, and methodology. This is not investment, legal, tax, accounting, or financial advice."

Create these fields:

1. Startup name
Type: short text
Required: yes
Internal name: startup_name

2. Founder email
Type: email
Required: yes
Internal name: founder_email

3. Country
Type: dropdown
Required: yes
Options: Romania, Bulgaria, Hungary, Poland, Czech Republic, Slovakia, Slovenia, Croatia, Serbia, Moldova, Ukraine, Estonia, Latvia, Lithuania, Other Europe, Other
Internal name: country

4. Sector
Type: dropdown
Required: yes
Options: B2B SaaS, FinTech, HealthTech, EdTech, AI / Automation, Marketplace, Developer Tools, Cybersecurity, ClimateTech, E-commerce, Consumer App, PropTech, HRTech, Logistics, Other
Internal name: sector

5. Business model
Type: dropdown
Required: yes
Options: Subscription SaaS, Transaction fee, Marketplace commission, Usage-based pricing, One-time licence, Services + product, Hardware + software, Advertising, Other, Not sure
Internal name: business_model

6. Current stage
Type: dropdown
Required: yes
Options: Idea, Problem validation, Prototype, MVP built, First users, First paying customers, Early recurring revenue, Preparing to raise, Already funded
Internal name: current_stage

7. Describe your startup in one sentence
Type: long text
Required: yes
Internal name: one_sentence_description

8. Target customer
Type: short text
Required: yes
Internal name: target_customer

9. Product status
Type: dropdown
Required: yes
Options: Idea only, Prototype, MVP, Live product, Live product with users, Live product with paying customers, Mature product
Internal name: product_status

10. Monthly revenue
Type: dropdown
Required: yes
Options: No revenue, €1–€500, €501–€2,000, €2,001–€5,000, €5,001–€10,000, €10,001–€25,000, €25,001+, Prefer not to say
Internal name: monthly_revenue_band

11. Paying customers
Type: dropdown
Required: yes
Options: 0, 1–3, 4–10, 11–25, 26–50, 51–100, 100+, Prefer not to say
Internal name: paying_customers_band

12. Monthly active users
Type: dropdown
Required: no
Options: 0, 1–100, 101–500, 501–2,000, 2,001–10,000, 10,001+, Not applicable, Prefer not to say
Internal name: mau_band

13. Revenue growth in the last 6 months
Type: dropdown
Required: yes
Options: No revenue yet, Declining, Flat, Growing slowly, Growing consistently, Growing quickly, Too early to tell, Prefer not to say
Internal name: revenue_growth_trend

14. Primary acquisition channel
Type: dropdown
Required: yes
Options: Founder network, Referrals, Outbound sales, Paid ads, Organic content, Partnerships, Marketplace / platform, Events / community, No clear channel yet, Other
Internal name: primary_acquisition_channel

15. What is the strongest evidence customers want this?
Type: long text
Required: yes
Internal name: strongest_customer_evidence

16. Number of founders
Type: number
Required: yes
Internal name: founder_count

17. Team size
Type: dropdown
Required: yes
Options: Solo founder, 2 founders, 3–5 people, 6–10 people, 11–25 people, 25+
Internal name: team_size_band

18. Is there a technical founder?
Type: multiple choice
Required: yes
Options: Yes, No, Not sure
Internal name: has_technical_founder

19. Is there a commercial or sales-oriented founder?
Type: multiple choice
Required: yes
Options: Yes, No, Not sure
Internal name: has_commercial_founder

20. Relevant founder or team experience
Type: long text
Required: no
Internal name: team_experience

21. Biggest current constraint
Type: dropdown
Required: yes
Options: Customer demand, Sales, Pricing, Product maturity, Technical capacity, Hiring, Funding, Go-to-market, Market positioning, Regulation, Competition, Execution focus, Not sure, Other
Internal name: biggest_constraint

22. Primary objective for the next 12 months
Type: dropdown
Required: yes
Options: Validate market, Grow revenue, Raise capital, Hire team, Improve product, Expand geographically, Change positioning, Build partnerships, Improve operations, Not sure
Internal name: twelve_month_objective

23. Largest planned investment in the next 12 months
Type: dropdown
Required: yes
Options: Product development, Sales, Marketing, Hiring, Fundraising, Market expansion, Partnerships, Operations, Legal / regulatory, Not sure
Internal name: largest_planned_investment

24. Funding raised so far
Type: dropdown
Required: yes
Options: None, Friends and family, Grants, Angel investment, Pre-seed, Seed, Venture capital, Revenue-funded, Prefer not to say
Internal name: funding_history

25. Biggest competitor or alternative
Type: short text
Required: no
Internal name: biggest_competitor

26. What should the brief focus on?
Type: long text
Required: no
Internal name: focus_question

Add a payment block:
Product name: Startup Intelligence Brief
Price: €49
Currency: EUR
Payment provider: Stripe inside Tally
Payment required before submission is completed.

Add hidden fields: assessment_version, form_type, source, language, utm_source, utm_medium, utm_campaign.

Set defaults:
assessment_version = v4
form_type = intelligence
language = en

End message:
"Your payment and submission were received. Your Founder Intelligence Brief will be generated and sent to your email."
```

---

# Form 3 — Decision Review

## Business Objective

Collect information for a focused review of one significant founder decision.

Expected completion time: under 10 minutes plus document upload.

## Tally AI Prompt

Paste this into Tally AI:

```text
Create a professional form called "Decision Review".

The form is for founders who want deeper analysis of one significant business decision after completing or planning a Startup Intelligence assessment.

Tone should be professional, concise, calm, and founder-friendly. Avoid hype, sales language, urgency, motivational language, and consultant jargon.

Add this introduction:

"Use this form when you are facing one important decision, such as fundraising, hiring, pricing, expansion, partnership, or product investment. You may upload documents if useful. You will receive a scoped review or follow-up depending on the information provided."

Create these fields:

1. Startup name
Type: short text
Required: yes
Internal name: startup_name

2. Founder email
Type: email
Required: yes
Internal name: founder_email

3. Have you already completed a Startup Intelligence assessment?
Type: multiple choice
Required: yes
Options: Yes, No, Not sure
Internal name: completed_intelligence_assessment

4. Decision type
Type: dropdown
Required: yes
Options: Raise capital, Hire, Change pricing, Enter a new market, Strategic partnership, Product investment, Go-to-market decision, Business model change, Other
Internal name: decision_type

5. Describe the decision you are trying to make
Type: long text
Required: yes
Internal name: decision_description

6. What would success look like?
Type: long text
Required: yes
Internal name: success_definition

7. What constraints should be considered?
Type: long text
Required: no
Internal name: decision_constraints

8. Select review modules
Type: checkbox
Required: yes
Options: Pitch deck review, Financial model review, Competitive context, Pricing review, Go-to-market review, Execution review, Fundraising readiness, Capital allocation, Other
Internal name: review_modules

9. Upload supporting documents
Type: file upload
Required: no
Allowed files: PDF, PPT, PPTX, XLS, XLSX, DOC, DOCX
Maximum file size: 20MB
Internal name: uploaded_documents

10. Anything else we should know?
Type: long text
Required: no
Internal name: additional_context

Add hidden fields: assessment_version, form_type, source, language, utm_source, utm_medium, utm_campaign.

Set defaults:
assessment_version = v4
form_type = decision_review
language = en

End message:
"Your Decision Review request was received. You will receive next steps by email."
```

---

# Payment Setup for Startup Intelligence

Use Tally's Stripe payment integration.

Payment block:

Product: Startup Intelligence Brief  
Price: €49  
Currency: EUR  
Payment required: yes

Backend rule:

The backend must generate the paid brief only when the Tally submission includes successful payment confirmation.

---

# Final Acceptance Criteria

The Tally setup is complete when:

- All three forms exist.
- Required fields are configured.
- Hidden fields are configured.
- Startup Intelligence includes Stripe payment inside Tally.
- All forms send webhooks to Vercel.
- Field labels are clear to founders.
- Field names map cleanly to backend fields.
- Snapshot can be completed in 5–8 minutes.
- Intelligence can be completed in 10–15 minutes.
- Decision Review can be completed in under 10 minutes excluding uploads.
