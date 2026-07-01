# 45_BENCHMARK_ACQUISITION_STRATEGY

Version: 4.0

Status: Production

---

# Purpose

This document defines how benchmark data should be identified, collected, reviewed and converted into usable benchmark intelligence for the Founder Intelligence Platform.

The objective is to build a defensible benchmark layer without introducing scraping risk, licensing risk or unverifiable data.

---

# Strategic Principle

Benchmark intelligence is a curated internal asset.

The platform must not depend on live external startup databases for report generation in Version 4.

The application should use reviewed Supabase benchmark records only.

---

# Priority Sources

Use sources in the following order:

1. Romanian ecosystem reports
2. Romanian startup and investor announcements
3. How to Web public data
4. SeedBlink public data
5. ROCA X public materials
6. Dealroom public ecosystem pages
7. Crunchbase public information
8. Termene public company information
9. ONRC public records where appropriate
10. ANAF public financial information where appropriate
11. Official company websites
12. Official LinkedIn company pages
13. Official investor press releases

---

# Collection Rules

Allowed:

- manual research;
- AI-assisted extraction from lawfully accessed public material;
- structured CSV preparation;
- human review before import;
- source URL retention.

Not allowed:

- automated scraping of copyrighted reports;
- bypassing paywalls;
- copying large portions of copyrighted text;
- importing unverifiable claims;
- estimating unknown metrics;
- using AI-generated facts as source data.

---

# Evidence Quality

Assign evidence quality to every record.

## High

Multiple reputable sources confirm the same fact.

## Medium

One reputable source confirms the fact.

## Low

The fact is weakly supported or indirectly evidenced.

Low-confidence data may be stored but should not materially influence recommendations.

---

# Company-Level Benchmark Records

Collect one row per startup where sufficient evidence exists.

Recommended fields:

```csv
company_name,website,linkedin,country,city,year_founded,industry,subcategory,business_model,stage,employees,funding_total_eur,latest_round,latest_round_date,lead_investor,other_investors,traction_signal,revenue_signal,growth_signal,customer_signal,geographic_presence,evidence_quality,source_1,source_2,source_3,notes
```

---

# Pattern-Level Benchmark Records

Create benchmark patterns only after enough company-level records exist.

Recommended fields:

```csv
country,industry,subcategory,business_model,stage,median_employees,median_funding,typical_arr,typical_customer_count,typical_growth_signal,typical_revenue_signal,typical_validation,typical_execution_risks,typical_next_milestone,sample_size,confidence,source_count
```

---

# Minimum Standard for Pattern Creation

A benchmark pattern should normally require:

- at least 10 comparable company records for medium confidence;
- at least 25 comparable company records for stronger confidence;
- clear geography, sector, business model and stage grouping.

If sample size is small, mark confidence as Low and explain coverage limitations.

---

# AI-Assisted Extraction Workflow

1. Identify source.
2. Extract facts into structured CSV.
3. Leave unknown values blank.
4. Preserve source URLs.
5. Human reviews every row.
6. Remove unsupported claims.
7. Import reviewed rows into Supabase.
8. Generate or update benchmark patterns.

AI is an extraction assistant, not an authority.

---

# Supabase Usage

Store reviewed data in:

- benchmark_companies
- benchmark_patterns
- benchmark_transactions
- benchmark_sources

Reports must query these tables only.

Do not query raw source documents at report-generation time.

---

# Update Cadence

Recommended cadence:

- monthly for Romanian startup funding and traction signals;
- quarterly for broader European benchmark updates;
- ad hoc for major funding rounds, exits, acquisitions or ecosystem reports.

---

# Report Usage

Benchmark data should support statements such as:

- comparable stage expectations;
- common evidence gaps;
- typical next-stage signals;
- funding-readiness context;
- traction maturity patterns.

Benchmark data should not be presented as exact valuation proof or investment advice.

---

End of document.
