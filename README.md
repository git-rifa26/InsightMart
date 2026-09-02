# InsightMart

Sales Analytics & Reporting Platform. Upload a sales CSV and get revenue trends, top performers,
regional and branch profitability, order-value distribution, customer retention and an exportable
PDF report.

**React + Vite** frontend · **Flask + SQLAlchemy** REST API · **MySQL 8** storage · **pandas** for
the cleaning and analytics.

> Frontend internals (design system, routing, motion, component structure) live in
> [FRONTEND_IMPLEMENTATION.md](FRONTEND_IMPLEMENTATION.md). This file covers the whole system and
> how to run it.

---

## Contents

- [How it fits together](#how-it-fits-together)
- [Requirements](#requirements)
- [Setup](#setup)
- [Demo accounts](#demo-accounts)
- [Uploading a CSV](#uploading-a-csv)
- [The data pipeline](#the-data-pipeline)
- [API reference](#api-reference)
- [Database schema](#database-schema)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## How it fits together

```
Browser (React, :5173)
    │  JSON + JWT in the Authorization header
    ▼
Flask REST API (:5000)          backend/app/routes/*.py
    │
    ├── services/csv_services.py    read → clean → validate the upload
    ├── services/analytics.py       pandas → the JSON the charts render
    └── services/pdf.py             ReportLab → the downloadable report
    │
    ▼
MySQL  (database: insightmart_app)
    users · organisations · uploads · sale_records
```

The application is **upload-first**: until a CSV has been analysed there is nothing to show, so the
Dashboard sends you to CSV Analysis instead. Everything on every chart is computed from the rows in
`sale_records` — nothing is hard-coded.

---

## Requirements

| Tool | Version | Notes |
|---|---|---|
| Python | 3.12+ | |
| Node | 20+ | |
| MySQL | 8.0 | The `MySQL80` service must be running |

---

## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` from the template and put your real MySQL password in it:

```bash
cp .env.example .env
```

| Variable | Example | Meaning |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *your password* | MySQL password |
| `DB_NAME` | `insightmart_app` | Database name — see [Troubleshooting](#troubleshooting) |
| `JWT_SECRET_KEY` | *any long random string* | Signs the access tokens |
| `CORS_ORIGINS` | `http://localhost:5173` | Origin allowed to call the API |

`.env` is gitignored, so your password never reaches the repository.

### 2. Create the database

```bash
python setup_db.py
```

This creates the database if it does not exist, builds the four tables from the SQLAlchemy models,
and seeds the four demo accounts. It is safe to re-run — it skips anything that already exists.
Use `python setup_db.py --reset` to drop every table and start over.

### 3. Start the API

```bash
python run.py
```

Serves on `http://localhost:5000`, printing every registered route on startup.

### 4. Frontend

From the project root, in a second terminal:

```bash
npm install
cp .env.example .env
npm run dev
```

Serves on `http://localhost:5173`.

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Where the Flask API lives |
| `VITE_USE_MOCK` | `false` | `true` runs the in-browser mock, no backend needed |

Set `VITE_USE_MOCK=true` to demo the UI with no Flask and no MySQL at all.

---

## Demo accounts

`setup_db.py` seeds one account per role. All four use the password **`demo1234`**, and the login
page lists them as one-click cards.

| Role | Email | What it unlocks |
|---|---|---|
| Individual | `individual@insightmart.dev` | Dashboard and CSV Analysis, free plan limits |
| Enterprise | `enterprise@insightmart.dev` | Team lead of *Northwind Retail Group*, full analysis suite |
| Team member | `team@insightmart.dev` | Read-only view of the organisation roster |
| Admin | `admin@insightmart.dev` | Platform oversight: users, organisations, uploads |

Enterprise accounts pool their data — every member of an organisation analyses the same uploads.
An individual only ever sees their own.

---

## Uploading a CSV

Drag a file onto the CSV Analysis page. Two shapes are accepted.

### A sales ledger — one row per order

The normal case. Three columns are required; the rest are optional and improve the analysis.

| Column | Required | Aliases accepted |
|---|---|---|
| `date` | **yes** | `order_date`, `invoice_date`, `transaction_date` |
| `product` | **yes** | `item`, `product_name` |
| `revenue` | **yes** | `sales`, `amount`, `total` |
| `quantity` | no | `qty`, `units` |
| `unit_price` | no | `price`, `rate` |
| `cost` | no | `cost_price`, `purchase_cost` — unlocks profit and margin |
| `category` | no | |
| `branch` | no | `store`, `city` |
| `region` | no | `zone`, `state` |
| `customer_id` | no | `customer` — unlocks retention and repeat rate |

### A product catalogue — one row per product

Files like Kaggle's `amazon.csv` list products, not sales: they have prices and ratings but no dates
and no revenue, so they cannot be analysed as they stand. The backend detects this and converts it
automatically — just upload the file.

`looks_like_catalogue()` triggers when there is no `date`/`revenue` pair but there *is*
`product_name` and `discounted_price`. Then `expand_catalogue()` builds order rows:

| Field | Where it comes from |
|---|---|
| product | `product_name` |
| category | first segment of the `category` path |
| unit_price | `discounted_price`, with `₹` and commas stripped |
| customer_id | a real reviewer id from the `user_id` list |
| date | spread over the last 12 months |
| order count | `rating_count` ÷ 3,000, capped at 10 per product |
| quantity | 1–4, weighted towards 1 |
| branch / region | one of 11 Indian cities |
| cost | 55–78% of price, i.e. a 22–45% gross margin |

The random choices are **seeded**, so the same file always produces the same numbers.

> These synthesised fields are an assumption, not data from the file. They exist so a catalogue can
> demo the full analytics suite. Do not read the dates or branches as real history.

---

## The data pipeline

`backend/app/services/csv_services.py` runs seven numbered steps, in order:

| Step | Function | What it does |
|---|---|---|
| 1 | `read_csv` | Parse the upload; reject anything empty or unreadable |
| 1b | `expand_catalogue` | Turn a product list into order rows (only if needed) |
| 2 | `clean_column_names` | Lowercase, snake_case, apply aliases, check required columns |
| 3 | `convert_types` | Text → dates and numbers; `errors="coerce"` instead of crashing |
| 4 | `handle_missing_values` | Fill quantity/price/revenue from each other; drop what cannot be saved |
| 5 | `remove_bad_rows` | Drop duplicates, non-positive sales, and IQR outliers |
| 6 | `add_derived_columns` | Add `profit`, `year`, `month`, `quarter` |
| 7 | `clean_sales_csv` | Runs all of the above, returns the frame plus a report |

Cleaned rows are written to `sale_records`. `backend/app/services/analytics.py` then turns them into
the JSON the charts read — KPIs with period-over-period deltas, monthly/quarterly/yearly trends,
product/category/region breakdowns, branch profitability, an order-value histogram and a
new-vs-returning retention series.

**Note on outliers:** step 5 drops revenue outside the IQR fence. On a catalogue import this removes
the high-value products, so the top histogram bands often read zero. That is the cleaning rule
working, not a bug — loosen it in `remove_bad_rows` if you want those orders kept.

---

## API reference

All routes are under `/api`. Everything except `/auth/*` needs `Authorization: Bearer <token>`.

### Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account, returns `{ user, access_token }` |
| POST | `/auth/login` | Sign in, returns `{ user, access_token }` |
| POST | `/auth/logout` | Client-side discard; tokens are stateless |

### Dashboard & analysis
| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard/?range=30d\|90d\|6m\|12m` | KPIs, trend, category/region share, top products, recent uploads |
| POST | `/analysis/upload` | Multipart CSV upload; cleans and stores it |
| GET | `/analysis/uploads` | Uploads this user can see |
| GET | `/analysis/?uploadId=<id>` | Full analysis payload; omit the id to analyse everything |
| GET | `/analysis/<id>/report` | The PDF report |

### Account
| Method | Path | Purpose |
|---|---|---|
| GET / PUT | `/account/profile` | Read / update name and email |
| PUT | `/account/password` | Change password |
| POST | `/account/subscription` | Change plan |

### Organisation
| Method | Path | Purpose |
|---|---|---|
| GET | `/organisation` | The team and its seat usage |
| POST | `/organisation/members` | Invite a member |
| PUT / DELETE | `/organisation/members/<id>` | Change role / remove |

### Admin
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/overview` | Platform stats, users, organisations, uploads |
| PUT | `/admin/users/<id>` · `/admin/users/<id>/status` | Edit a user / suspend them |
| DELETE | `/admin/users/<id>` · `/admin/organisations/<id>` · `/admin/uploads/<id>` | Delete |

> **Trailing slashes matter.** `/api/dashboard/` and `/api/analysis/` are registered *with* one.
> Requesting them without it makes Flask reply `308 Redirect`, which a browser's CORS preflight
> rejects. `src/services/api.js` sends the slash deliberately.

---

## Database schema

Four tables, created from the SQLAlchemy models in `backend/app/models/`.

| Table | Holds | Key columns |
|---|---|---|
| `users` | Every account, all four roles | `email`, `password_hash`, `role`, `plan`, `organisation_id`, `member_role`, `upload_limit` |
| `organisations` | One row per enterprise team | `name`, `owner_id`, `seat_limit` |
| `uploads` | One row per CSV put through the cleaner | `filename`, `size`, `rows`, `status`, `error`, `has_cost_data`, `uploaded_by` |
| `sale_records` | One row per cleaned order | `upload_id`, `date`, `product`, `category`, `branch`, `region`, `customer_id`, `quantity`, `unit_price`, `revenue`, `cost`, `profit`, `year`, `month`, `month_index`, `quarter` |

The period columns are denormalised onto each row so the grouping queries stay simple.

---

## Project structure

```
InsightMart/
├── README.md                       this file
├── FRONTEND_IMPLEMENTATION.md      frontend internals
├── .env                            VITE_API_BASE_URL, VITE_USE_MOCK
│
├── backend/
│   ├── .env                        MySQL + JWT config (gitignored)
│   ├── requirements.txt
│   ├── run.py                      dev entry point
│   ├── setup_db.py                 create database, tables and demo accounts
│   ├── scripts/
│   │   └── amazon_to_sales.py      optional CLI catalogue → sales CSV converter
│   └── app/
│       ├── __init__.py             app factory, CORS, JWT, blueprints
│       ├── models/                 user, organisation, upload, sales
│       ├── routes/                 auth, dashboard, analysis, account, organisation, admin
│       └── services/               csv_services, analytics, pdf
│
└── src/                            React frontend — see FRONTEND_IMPLEMENTATION.md
    ├── components/  context/  hooks/  lib/  pages/  routes/
    └── services/
        ├── api.js                  the only place that talks to Flask
        └── mock/                   in-browser mock backend
```

`backend/scripts/amazon_to_sales.py` is optional — the API converts catalogues on upload now. Keep
it if you want a sales CSV on disk:

```bash
python scripts/amazon_to_sales.py "path/to/amazon.csv"
```

---

## Troubleshooting

**"Missing required column(s): date, revenue"**
The file has no dates and no revenue and was not recognised as a catalogue. A catalogue needs both
`product_name` and `discounted_price`. Otherwise add the three required columns.

**"Could not reach the server. Is the Flask API running?"**
Check `python run.py` is up on port 5000 and that `CORS_ORIGINS` in `backend/.env` matches the
origin the browser is using.

**You get logged out after a few minutes**
`create_app()` does not set `JWT_ACCESS_TOKEN_EXPIRES`, so Flask-JWT-Extended's 15-minute default
applies. Add `app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)` to lengthen it.

**`Failed to add the foreign key constraint ... referenced table 'uploads'`**
Another schema is already using those table names in that database. This project uses
`insightmart_app` rather than `insightmart` for exactly this reason — the older `backend-rishabh`
schema still occupies `insightmart`. Point `DB_NAME` at an empty database.

**Charts are empty after a successful upload**
Every row may have been dropped in cleaning. The upload response includes a report with
`rows_uploaded`, `rows_kept` and how many went as incomplete or as outliers.

**`backend-rishabh/`**
A superseded earlier backend. It is not used and not wired to anything — `backend/` is the live one.
