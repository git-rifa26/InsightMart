# InsightMart Backend — Documentation (Final)

Flask REST API with JWT authentication and a MySQL database (via SQLAlchemy).
This matches the codebase exactly as it stands — every filename, route, and
model here is what's actually in the repo, verified by running the full
register → login → upload → analyze → export flow end to end before writing
this.

---

## 1. Tech stack

| Layer | Technology |
|---|---|
| Web framework | Flask |
| Database | MySQL 8, accessed through PyMySQL |
| ORM | Flask-SQLAlchemy |
| Auth | Flask-JWT-Extended (JSON Web Tokens) |
| Cross-origin requests | Flask-CORS |
| CSV parsing / cleaning | pandas, numpy |
| PDF report generation | ReportLab |
| Config | python-dotenv (`.env` file) |

---

## 2. Folder structure

```
backend/
  app/
    __init__.py            # app factory — wires everything together
    models/
      user.py               # User table
      organisation.py        # Organisation table
      upload.py               # Upload table (one row per CSV upload)
      sales.py                 # SaleRecord table (one row per cleaned CSV line)
    routes/
      auth.py                # /api/auth/*        register, login, logout
      account.py               # /api/account/*      profile, password, plan
      dashboard.py               # /api/dashboard      KPI summary
      analysis.py                  # /api/analysis/*     CSV upload + analytics + PDF export
      organisation.py                # /api/organisation/*   org + member management
      admin.py                        # /api/admin/*            platform-wide oversight
    services/
      csv_service.py         # pandas pipeline that cleans an uploaded CSV
      analytics.py            # turns cleaned rows into KPIs/charts
      pdf.py                    # builds the PDF report with ReportLab
  run.py                    # entrypoint — starts the Flask dev server + prints route map
  requirements.txt
  .env                      # DB credentials, JWT secret, CORS origin (not committed)
```

**Note on naming:** `models/sales.py` (not `sale.py`), `services/analytics.py`
and `services/pdf.py` (not `..._service.py`). Every `import` in the route
files matches these exact names — if you rename a file, the corresponding
`from app.services.X import ...` line inside the route function has to be
updated too, or you'll get a `ModuleNotFoundError` the first time that route
is called (imports are lazy, done inside each function body, so a broken
import doesn't show up until that specific endpoint is hit).

---

## 3. How the app boots (`app/__init__.py`)

`create_app()` is a **Flask application factory** — the `app` object is
built inside a function rather than at import time, so multiple instances
can be created with different configs (useful for testing) and import-order
issues are avoided.

Boot sequence, in order:

1. **Load `.env`** — `load_dotenv()` reads `DB_USER`, `DB_PASSWORD`,
   `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET_KEY`, `CORS_ORIGINS`.
2. **Build the MySQL connection string** with SQLAlchemy's `URL.create(...)`,
   which safely escapes special characters in the password.
3. **Configure Flask** — `SQLALCHEMY_DATABASE_URI` and `JWT_SECRET_KEY` (read
   from the environment, not hardcoded) go onto `app.config`.
4. **Initialize extensions** — `db.init_app(app)`, `JWTManager(app)`,
   `CORS(app, ...)` scoped to `/api/*` and the origin in `CORS_ORIGINS`
   (normally the React dev server on `http://localhost:5173`). Without this,
   the browser blocks every frontend request even if the backend is fine.
5. **Import models** so SQLAlchemy registers their table definitions before
   anything queries them.
6. **Register blueprints**, each under its own `/api/...` prefix:

   | Blueprint | Prefix |
   |---|---|
   | `auth_bp` | `/api/auth` |
   | `dashboard_bp` | `/api/dashboard` |
   | `account_bp` | `/api/account` |
   | `organisation_bp` | `/api/organisation` |
   | `admin_bp` | `/api/admin` |
   | `analysis_bp` | `/api/analysis` |

   **This is the single most common source of bugs when adding a new
   blueprint** — forgetting `url_prefix="/api/..."` on `register_blueprint`
   silently mounts the routes at the bare path (e.g. `/register` instead of
   `/api/auth/register`), and the frontend's requests 404 with no other
   error. `run.py` prints the full route map on every boot specifically so
   this is easy to catch — check it after adding any new route.
7. **Test the DB connection** with `SELECT 1`, printing
   `MySQL connected successfully!` so a broken DB connection fails loudly at
   startup instead of on the first request.

---

## 4. Database models

### `User` (`users` table, `models/user.py`)

| Column | Purpose |
|---|---|
| `id` | Primary key (integer, auto-increment) |
| `name`, `email` | Basic identity. `email` is unique. |
| `password_hash` | **Currently stores the plain-text password**, not an actual hash — see §8. |
| `role` | `"individual"`, `"enterprise"`, `"member"`, or `"admin"` — controls what the account can do. |
| `plan` | `"free"`, `"pro"`, or `"enterprise"`. |
| `status` | `"active"`, `"invited"`, or `"suspended"`. |
| `organisation_id` | FK to `organisations.id`. `NULL` for individual accounts. |
| `member_role` | A *second*, separate role — the person's title inside their org (`"Lead"`, `"Analyst"`, `"Viewer"`). Distinct from `role` above. The enterprise account that creates an org is automatically set to `"Lead"`. |
| `uploads_this_month` / `upload_limit` | Enforces plan-based upload caps (30 for individual, 300 for enterprise/member). |
| `last_active` | Not currently updated on login — reserved for future use. |
| `created_at` | Set automatically by the DB (`server_default=db.func.now()`). |

### `Organisation` (`organisations` table, `models/organisation.py`)

`id`, `name`, `owner_id` (FK to the `User` who created it), `seat_limit`
(default 25), `created_at`.

### `Upload` (`uploads` table, `models/upload.py`)

One row per CSV file uploaded. `filename`, `size`, `rows` (cleaned rows
kept), `status` (`"processed"` / `"failed"`), `error` (set when cleaning
fails), `has_cost_data`, `uploaded_by` (FK to `User`), `organisation_id`
(nullable FK), `uploaded_at`. Has a `records` relationship
(`db.relationship("SaleRecord", backref="upload", lazy="dynamic")`) so
`upload.records.all()` fetches every row belonging to that upload.

### `SaleRecord` (`sale_records` table, `models/sales.py`)

One row per **cleaned** CSV line. `upload_id` (FK), `date`, `product`,
`category`, `branch`, `region`, `customer_id`, `quantity`, `unit_price`,
`revenue`, `cost`, `profit`, plus derived `year`, `month`, `month_index`,
`quarter` computed during cleaning so analytics queries don't recompute them.

---

## 5. Authentication flow

1. **Register** (`POST /api/auth/register`) — creates a `User`. If
   `accountType` is `"enterprise"`, also creates an `Organisation` (the new
   user becomes `owner_id` and gets `member_role="Lead"`). Returns
   `{ user, access_token }`.
2. **Login** (`POST /api/auth/login`) — looks up by email, compares
   `password_hash` directly against the submitted password (plain-text
   comparison — see §8), checks `status != "suspended"`, issues a JWT via
   `create_access_token(identity=str(user.id), additional_claims={"role": user.role})`.
3. **Every protected route** uses `@jwt_required()`, which validates the
   `Authorization: Bearer <token>` header before the view runs.
   `get_jwt_identity()` retrieves the user id embedded in the token; the
   route then loads the full `User` row from that id.
4. **Stateless** — no server-side session or token blocklist. `/api/auth/logout`
   is a no-op; the frontend just discards its stored token.

---

## 6. CSV upload → analytics pipeline

Three stages, matching `POST /api/analysis/upload`'s `upload_csv()` function:

### Stage 1 — Cleaning (`services/csv_service.py`)

`clean_sales_csv(file)`:
1. Reads the file with pandas.
2. Normalizes column names, mapping common aliases (`"Order Date"` → `date`,
   `"Sales"` → `revenue`, etc. — see `COLUMN_ALIASES`).
3. Converts types — parses dates, strips currency symbols/commas, coerces to
   numeric.
4. Fills what's derivable (missing `quantity` → 1; missing
   `unit_price`/`revenue` derived from each other) and drops unusable rows
   (no date, no product, no revenue).
5. Drops duplicates and statistical outliers (IQR rule on `revenue`, applied
   only when there are ≥10 rows).
6. Adds derived columns: `profit`, `year`, `month`, `quarter`.

Returns the cleaned DataFrame plus a `report` dict (`rows_uploaded`,
`rows_kept`, rows removed and why, `has_cost_data`).

### Stage 2 — Storage (`routes/analysis.py`)

The cleaned rows become `SaleRecord` objects tied to a new `Upload` row.
`uploads_this_month` is incremented on the user; requests are rejected with
`403` once the limit is hit. If cleaning raises `CsvValidationError`, a
`status="failed"` `Upload` row is still created with the error message, so
failed attempts show up in upload history instead of vanishing.

### Stage 3 — Analytics (`services/analytics.py`)

`full_analysis(df)` computes:
- `compute_kpis` — revenue, profit, orders, unique customers, average order
  value, margin %, repeat purchase rate.
- `monthly_trend` — revenue/profit/orders per calendar month.
- `top_products` — highest-revenue products.
- `category_share` — revenue by product category.
- `branch_profitability` — revenue/profit/margin by branch.

Backs both `GET /api/analysis` (JSON for charts) and
`GET /api/analysis/<id>/report` (fed into the PDF builder).

### Stage 4 — PDF export (`services/pdf.py`)

`build_analysis_report(upload, analysis)` — ReportLab lays out a title,
source filename, generation date, and a KPI table. Returns raw PDF bytes,
streamed back via `send_file(...)`.

---

## 7. Endpoint reference

All routes are prefixed with `/api`. All routes except register/login/logout
require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an individual or enterprise account |
| POST | `/auth/login` | Authenticate, get a JWT |
| POST | `/auth/logout` | No-op (stateless JWT) |
| GET | `/account/profile` | Get the signed-in user's profile |
| PUT | `/account/profile` | Update name/email |
| PUT | `/account/password` | Change password |
| POST | `/account/subscription` | Change plan |
| GET | `/dashboard/` | User + organisation summary |
| POST | `/analysis/upload` | Upload + clean + store a sales CSV |
| GET | `/analysis/uploads` | List past uploads |
| GET | `/analysis/?uploadId=<id>` | Full analytics for one upload (or all, if omitted) |
| GET | `/analysis/<id>/report` | Download a PDF report for one upload |
| GET | `/organisation` | Get the signed-in user's org + members |
| POST | `/organisation/members` | Invite a member |
| PUT | `/organisation/members/<id>` | Change a member's role |
| DELETE | `/organisation/members/<id>` | Remove a member |
| GET | `/admin/overview` | Platform-wide stats (admin only) |
| PUT | `/admin/users/<id>/status` | Suspend/activate a user (admin only) |
| PUT | `/admin/users/<id>` | Edit a user (admin only) |
| DELETE | `/admin/users/<id>` | Delete a user (admin only) |
| DELETE | `/admin/organisations/<id>` | Delete an organisation (admin only) |
| DELETE | `/admin/uploads/<id>` | Delete an upload (admin only) |

Note the trailing slash on `/dashboard/` and `/analysis/` — both blueprints
define their base route as `"/"` rather than `""`, since Werkzeug rejects a
truly empty rule when combined with a blank `url_prefix`. Flask treats
`/api/dashboard` and `/api/dashboard/` as equivalent for `GET`, so this
doesn't require any special handling on the frontend.

---

## 8. Known limitations / things to revisit

- **Passwords are stored in plain text**, not hashed — a deliberate choice
  for now to keep the code simple while learning. Not safe beyond local
  development. `werkzeug.security.generate_password_hash` /
  `check_password_hash` is a small, contained change for later.
- **No database migrations** — schema changes are applied by hand
  (`db.create_all()` only creates *new* tables; it never alters existing
  ones). Changing a column on `users` or `organisations` after they already
  exist in MySQL requires a manual `ALTER TABLE`, or dropping and recreating
  those tables. `Flask-Migrate` is in `requirements.txt` but not wired up
  yet — worth adopting once the schema stabilizes.
- **Invited organisation members** get a hardcoded placeholder password
  (`"changeme123"`) on creation — there's no "set your password" flow yet,
  so an invited person can't actually log in until that's built.
- **No input validation library** — `marshmallow` is in `requirements.txt`
  but unused; validation is manual `if not field: return error` checks in
  each route.
- **`last_active`** is defined on `User` but never actually updated anywhere
  (not on login, not elsewhere) — it will always read `null` until that's
  wired in.
