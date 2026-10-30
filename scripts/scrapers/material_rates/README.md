# Sukoon Construction OS - Daily Material Rates Scraper

Zero-cost automated pipeline in Python to track, normalize, and update daily construction material rates across major Indian cities (Indore, Mumbai, Delhi, Bengaluru, Chennai, Pune, Hyderabad, Kolkata).

---

## Architecture Overview

```
[Public Aggregators / Mandi Feeds]
                 │
                 ▼
[GitHub Actions (08:00 AM IST Cron)] ──> [Python 3.11 Scraper (scraper.py)]
                                                       │
                                                       ▼
                                            [PostgreSQL Database]
                                          (material_rates Table)
                                                       │
                                                       ▼
                                      [Sukoon Construction Web & Mobile API]
```

- **Runtime:** Python 3.11+
- **Database:** PostgreSQL (Supabase / Neon free tier)
- **Automation:** GitHub Actions Scheduled Cron (`30 2 * * *` = 08:00 AM IST)
- **Monthly Infrastructure Cost:** ₹0 (100% Free Tier)

---

## 1. Quick Local Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r scripts/scrapers/material_rates/requirements.txt
   ```

2. **Run a Dry-Run (No Database required):**
   ```bash
   python scripts/scrapers/material_rates/scraper.py --dry-run
   ```

3. **Run with PostgreSQL connection:**
   ```bash
   export DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require"
   python scripts/scrapers/material_rates/scraper.py
   ```

---

## 2. Database Setup

Execute `schema.sql` in your Supabase or Neon SQL Editor:
```bash
psql $DATABASE_URL -f scripts/scrapers/material_rates/schema.sql
```

This creates:
- The `material_rates` table with an atomic unique constraint on `(city, material_type, sub_category_or_brand, recorded_date)`.
- Composite indexes on `(city, recorded_date DESC)` and `(material_type, recorded_date DESC)`.
- The `v_latest_material_rates` analytical view for instantaneous client queries.

---

## 3. GitHub Actions Setup

1. Navigate to your GitHub repository: **Settings > Secrets and variables > Actions**.
2. Click **New repository secret**.
3. Name: `DATABASE_URL`
4. Value: Paste your PostgreSQL connection string.
5. Go to the **Actions** tab > select **Daily Construction Material Rates Updater** > click **Run workflow** to test immediately.
