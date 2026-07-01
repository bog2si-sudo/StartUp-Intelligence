# 44_BENCHMARK_DATA_PIPELINE

Version: 4.0

Status: Production

---

# Purpose

This document defines the benchmark data ingestion pipeline for the Founder Intelligence Platform.

The objective is to create a curated benchmark database that supports evidence-based startup readiness and capital allocation reports.

---

# Source Categories

Prioritise:

- How to Web
- SeedBlink
- ROCA X
- Dealroom public pages
- Crunchbase public information
- Termene
- ONRC
- ANAF where appropriate
- official company websites
- official LinkedIn company pages
- official investor announcements
- official press releases

---

# Ingestion Workflow

```text
Public source
    ↓
AI-assisted extraction
    ↓
Human review
    ↓
CSV preparation
    ↓
Supabase import
    ↓
Benchmark pattern generation
    ↓
Founder Intelligence report usage
```

---

# Rules

- Do not scrape copyrighted reports automatically.
- Do not bypass paywalls.
- Do not invent missing data.
- Do not estimate unknown metrics.
- Use AI only to structure information.
- Store structured benchmark facts only.
- Keep source URLs for every important value.
- Treat benchmark updates as incremental.

---

# Company-Level CSV

Use this structure for company-level records:

```csv
company_name,website,linkedin,country,city,year_founded,industry,subcategory,business_model,stage,employees,funding_total_eur,latest_round,latest_round_date,lead_investor,other_investors,traction_signal,revenue_signal,growth_signal,customer_signal,geographic_presence,evidence_quality,source_1,source_2,source_3,notes
```

---

# Pattern-Level CSV

Use this structure for benchmark patterns:

```csv
country,industry,subcategory,business_model,stage,median_employees,median_funding,typical_arr,typical_customer_count,typical_growth_signal,typical_revenue_signal,typical_validation,typical_execution_risks,typical_next_milestone,sample_size,confidence,source_count
```

---

# Review Process

Before importing benchmark data into Supabase:

1. Verify source URLs.
2. Remove unverifiable values.
3. Normalize country, sector and stage names.
4. Assign evidence quality.
5. Confirm that no raw copyrighted text is copied into the database.

---

# Supabase Import

Import reviewed CSV files into:

- benchmark_companies
- benchmark_patterns
- benchmark_transactions
- benchmark_sources

The report engine must query Supabase benchmark tables, not raw source documents.

---

# Update Cadence

Recommended update frequency:

- monthly for Romanian startup funding and ecosystem signals;
- quarterly for European benchmark patterns;
- ad hoc for major funding rounds, exits or acquisitions.

---

End of document.
