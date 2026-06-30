# 03 — Tally Forms Setup

Create three separate Tally forms.

Each form has its own public URL and webhook endpoint.

## Form A — Free Decision Check

### Tally title

Free Startup Decision Check

### Tally description

Before spending more money on development, marketing, hiring, or fundraising support, answer a structured set of questions and receive a short decision check.

You will get a readiness score, main constraint, evidence quality check, one investor-style objection, one useful experiment, and an honest view on whether deeper analysis is worth it.

No credit card required.

### Questions

1. Startup name  
Type: Short text  
Required: Yes  
Backend field: `startup_name`

2. Email  
Type: Email  
Required: Yes  
Backend field: `email`

3. Country of operation  
Type: Dropdown  
Required: Yes  
Options: Romania, Moldova, Bulgaria, Serbia, Croatia, Slovenia, Slovakia, Czechia, Hungary, Poland, Estonia, Latvia, Lithuania, Ukraine, Other Europe, Other  
Backend field: `country`

4. Sector  
Type: Dropdown + Other  
Required: Yes  
Suggested options: B2B SaaS, Fintech, HealthTech, EdTech, ClimateTech, AI/Automation, Marketplace, Consumer App, E-commerce, Cybersecurity, Developer Tools, HRTech, PropTech, Logistics, Other  
Backend field: `sector`

5. Current stage  
Type: Dropdown  
Required: Yes  
Options: Idea, Problem validation, Prototype, MVP built, First users, First paying customers, Repeatable revenue emerging, Preparing to raise, Already funded  
Backend field: `stage`

6. What problem are you solving?  
Type: Long text  
Required: Yes  
Backend field: `problem_statement`

7. Who is the target customer?  
Type: Short text  
Required: Yes  
Backend field: `target_customer`

8. What have you built so far?  
Type: Dropdown  
Required: Yes  
Options: Nothing yet, Landing page, Prototype, MVP, Live product, Product with paying customers, Mature product  
Backend field: `product_status`

9. Current monthly revenue  
Type: Dropdown  
Required: Yes  
Options: €0, €1–500, €501–2k, €2k–5k, €5k–10k, €10k–25k, €25k+  
Backend field: `revenue_band`

10. Number of paying customers  
Type: Dropdown  
Required: Yes  
Options: 0, 1–3, 4–10, 11–25, 26–50, 51–100, 100+  
Backend field: `paying_customers_band`

11. Main acquisition channel  
Type: Dropdown + Other  
Required: Yes  
Options: Founder network, Referrals, Outbound sales, Paid ads, Organic content, Partnerships, Marketplace/platform, Events/community, No clear channel yet, Other  
Backend field: `acquisition_channel`

12. Biggest current constraint  
Type: Dropdown + Other  
Required: Yes  
Options: unclear customer demand, weak product, no technical capacity, weak sales, limited capital, unclear pricing, weak team, too many priorities, fundraising, regulation, competition, other  
Backend field: `biggest_constraint`

13. What are you considering spending money on next?  
Type: Checkbox  
Required: Yes  
Options: Product development, marketing, sales, hiring, fundraising support, legal/accounting, market research, AI tools, expansion, not sure  
Backend field: `next_spend_area`

14. Main objective in the next 6 months  
Type: Dropdown + Other  
Required: Yes  
Options: validate problem, launch MVP, get first users, get first paying customers, grow revenue, raise funding, enter new market, improve operations, reposition, other  
Backend field: `six_month_objective`

15. What evidence do you currently have that customers want this?  
Type: Long text  
Required: Yes  
Help text: Mention interviews, users, pilots, LOIs, revenue, retention, waiting list, conversion, or other proof.  
Backend field: `demand_evidence`

16. Anything important we should know?  
Type: Long text  
Required: No  
Backend field: `additional_notes`

### Completion behavior

Show confirmation message:

Your Decision Check was submitted. If the email is valid, your report will be generated and sent shortly.

### Webhook

Endpoint: `/api/tally/free`  
Method: POST  
Secret env var: `TALLY_WEBHOOK_SECRET_FREE`

---

## Form B — Startup Readiness & Capital Allocation Report

### Tally title

Startup Readiness & Capital Allocation Report

### Tally description

Answer a structured set of questions about your startup and receive a benchmark-informed report covering readiness, evidence gaps, valuation positioning, investor objections, and capital allocation priorities.

Price: €49. You will be redirected to Stripe Checkout after submission.

### Questions

1. Startup name — Short text — Required — `startup_name`
2. Email — Email — Required — `email`
3. Country — Dropdown — Required — `country`
4. Sector — Dropdown + Other — Required — `sector`
5. Website / product link — URL — Optional — `website_url`
6. Current stage — Dropdown — Required — `stage`
7. One-sentence description — Long text — Required — `one_sentence_description`
8. Number of founders — Number — Required — `founder_count`
9. Technical founder? — Yes/No — Required — `has_technical_founder`
10. Commercial/sales founder? — Yes/No — Required — `has_commercial_founder`
11. Relevant industry experience — Long text — Optional — `industry_experience`
12. Current team size — Number — Required — `team_size`
13. Main team gap — Dropdown + Other — Required — `main_team_gap`
14. Current monthly revenue — Dropdown — Required — `revenue_band`
15. Paying customers — Dropdown — Required — `paying_customers_band`
16. Monthly active users — Dropdown — Optional — `mau_band`
17. Revenue growth trend — Dropdown — Required — `revenue_growth_trend`
18. Main acquisition channel — Dropdown + Other — Required — `acquisition_channel`
19. Conversion / retention / churn data if available — Long text — Optional — `conversion_retention_churn`
20. Strongest proof of demand — Long text — Required — `strongest_demand_proof`
21. Product stage — Dropdown — Required — `product_stage`
22. What is currently working? — Long text — Required — `what_is_working`
23. What is not working? — Long text — Required — `what_is_not_working`
24. Biggest risk — Dropdown + Other — Required — `biggest_risk`
25. Biggest competitor or alternative — Short text — Optional — `biggest_competitor`
26. Main objective for next 12 months — Dropdown + Other — Required — `twelve_month_objective`
27. What are you considering spending money on? — Checkbox — Required — `planned_spend`
28. Funding raised so far — Dropdown + optional amount — Required — `funding_raised`
29. Anything else we should know? — Long text — Optional — `additional_notes`

### Completion behavior

Redirect to backend checkout endpoint:

`https://YOUR_DOMAIN.com/api/checkout/create?submission_id={submission_id}`

Important implementation note:

Tally may not know the backend `submission_id` until webhook processing. A safer flow is:

1. Tally submits form.
2. Backend webhook creates submission and emails checkout link.
3. Or embed the paid form in your own app so your frontend posts to backend first, then redirects to Stripe.

Recommended MVP-safe approach:

- Tally submission triggers `/api/tally/paid`
- Backend creates submission + Stripe Checkout session
- Backend sends user an email with checkout link
- Tally confirmation page also says: "Your checkout link is being prepared. Check your email."

Better final approach:

- Use custom frontend form for paid report.
- Keep Tally for free and review request.
- This avoids redirect limitations.

If you insist on Tally for paid:

- Use Tally redirect to a static "continue to checkout" page.
- That page asks for email and finds the pending submission.
- Then redirects to Stripe.

### Webhook

Endpoint: `/api/tally/paid`  
Method: POST  
Secret env var: `TALLY_WEBHOOK_SECRET_PAID`

---

## Form C — Next-Stage Readiness Review

### Tally title

Next-Stage Readiness Review Request

### Tally description

For founders who have moved beyond a vague idea and need help with a specific execution, capital allocation, fundraising readiness, or narrative-to-numbers decision.

This is not an instant checkout. Submit your request and receive a recommended scope, expected turnaround, and fixed price before any work begins.

### Questions

1. Startup name — Short text — Required — `startup_name`
2. Email — Email — Required — `email`
3. Country — Dropdown — Required — `country`
4. Sector — Dropdown + Other — Required — `sector`
5. Website / product link — URL — Optional — `website_url`
6. Current stage — Dropdown — Required — `stage`
7. What next stage are you trying to reach? — Dropdown — Required — `next_stage_goal`
Options:
- MVP to first users
- First users to paying customers
- Paying customers to repeatable traction
- Traction to fundraising readiness
- Local traction to expansion
- Better pitch / narrative
- Better financial logic
- Better capital allocation
- Other

8. What decision are you trying to make now? — Checkbox — Required — `decision_needed`
Options:
- Raise or not raise
- What to build next
- Where to spend limited capital
- Whether to hire
- Whether to expand
- Whether to change positioning
- Whether the valuation story is credible
- How to close investor objections
- Other

9. What do you want reviewed? — Checkbox — Required — `materials_available`
Options:
- Pitch deck
- Financial model
- Business plan
- Product link
- KPI snapshot
- Investor memo
- No documents yet
- Other

10. Upload documents — File upload — Optional — `uploaded_files`
Allowed: PDF, PPTX, XLSX, DOCX  
Max: set according to Tally plan

11. Explain why you need this review — Long text — Required — `review_reason`

12. Do you want AI-only, human review, or both? — Dropdown — Required — `preferred_review_type`
Options:
- AI-only if sufficient
- AI + human review
- Human advisory call
- Not sure, recommend the right scope

13. Timing — Dropdown — Required — `timing`
Options:
- This week
- Next 2 weeks
- This month
- No urgency

### Completion behavior

Confirmation message:

Your request was received. You will receive a recommended scope, expected turnaround, and fixed price before any work begins.

### Webhook

Endpoint: `/api/tally/review`  
Method: POST  
Secret env var: `TALLY_WEBHOOK_SECRET_REVIEW`
