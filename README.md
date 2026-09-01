# InsightMart

Sales Analytics & Reporting Platform — upload a sales CSV and get revenue trends, top performers,
branch profitability, retention and an exportable PDF report.

A decoupled application: a **React** single-page frontend, a **Flask** REST API, and a **MySQL**
database. This repository holds the frontend.

---

## System Architecture

Three classes of user reach the same React application. It calls one Flask REST API over JSON with a
JWT, and that API owns all business logic and the only database connection.

```mermaid
flowchart TB
    subgraph users ["Users"]
        direction LR
        U1["Individual<br/><i>single user</i>"]
        U2["Enterprise<br/><i>owner + team</i>"]
        U3["Admin<br/><i>platform-wide</i>"]
    end

    subgraph frontend ["Frontend · React SPA"]
        SPA["React 18 + Vite<br/>Router · Context · Recharts · Tailwind"]
        GW["services/api.js<br/><i>single gateway</i>"]
        MOCK[("mock backend<br/>VITE_USE_MOCK=true")]
        SPA --> GW
        GW -.->|mock mode| MOCK
    end

    subgraph backend ["Backend · Flask REST API"]
        direction TB
        AUTH["Auth & Account<br/>/auth · /account"]
        FEAT["Feature Services<br/>/dashboard · /organisation · /admin"]
        CSV["CSV & Analytics<br/>/analysis · Pandas · ReportLab"]
        API["Flask<br/>JWT · CORS · Marshmallow"]
        AUTH --> API
        FEAT --> API
        CSV --> API
    end

    DB[("MySQL 8<br/>SQLAlchemy + PyMySQL")]

    U1 --> SPA
    U2 --> SPA
    U3 --> SPA
    GW -->|JSON + Bearer JWT| AUTH
    GW -->|JSON + Bearer JWT| FEAT
    GW -->|JSON + Bearer JWT| CSV
    API -->|SQLAlchemy ORM| DB
```

### Boundaries

| Layer | Responsibility |
|---|---|
| **React SPA** | Presentation, routing and session state. Role gating here is for navigation only — the API re-enforces it. |
| **Service gateway** | The one place that talks HTTP. Components call named functions, never Axios directly. |
| **Flask REST API** | All business logic, validation, authentication and analytics. |
| **MySQL** | Reachable only through SQLAlchemy inside Flask. The frontend never touches it. |

### Frontend composition

```mermaid
flowchart TB
    M["main.jsx → App.jsx"]
    M --> T["ThemeProvider<br/><i>dark / light tokens</i>"]
    M --> A["AuthProvider<br/><i>user · JWT · role · plan</i>"]
    M --> N["ToastProvider<br/><i>notification queue</i>"]
    T --> R
    A --> R
    N --> R
    R["AppRoutes<br/>AnimatePresence + ProtectedRoute"]
    R --> L1["MarketingLayout<br/><i>Navbar + Footer</i>"]
    R --> L2["AuthLayout<br/><i>split screen</i>"]
    R --> L3["AppShell<br/><i>Sidebar + Chat panel</i>"]
    L1 --> P["Pages"]
    L2 --> P
    L3 --> P
    P --> G["services/api.js"]
```

---

## Data Flow

### End-to-end journey

```mermaid
flowchart LR
    S1["1 · Sign up<br/>or log in"] --> S2["2 · Organisation<br/>setup"]
    S2 --> S3["3 · CSV<br/>upload"]
    S3 --> S4["4 · Validation<br/>& parsing"]
    S4 --> S5["5 · Cleaning<br/>& storage"]
    S5 --> S6["6 · Analytics<br/>computation"]
    S6 --> S7["7 · Visualisation"]
    S7 --> S8["8 · Export<br/>& support"]
    S1 -.->|individual accounts<br/>skip step 2| S3
```

| # | Stage | What happens |
|---|---|---|
| 1 | **Sign up / log in** | Register as Individual or Enterprise. Flask hashes the password and returns a JWT, which the auth context stores. |
| 2 | **Organisation setup** | Enterprise accounts create an organisation and invite team members. Individual accounts skip this entirely. |
| 3 | **CSV upload** | The user drops a sales file on the CSV Analysis page. Columns are previewed client-side before anything is sent. |
| 4 | **Validation & parsing** | Flask checks the file type and required columns, then reads it with Pandas. |
| 5 | **Cleaning & storage** | Missing values are handled, records are normalised, and rows are written to MySQL through SQLAlchemy. |
| 6 | **Analytics computation** | The analytics service computes revenue, top products and regions, profitability, retention and order metrics. |
| 7 | **Visualisation** | Dashboard and CSV Analysis render the results as KPI cards plus bar, line, histogram and donut charts. |
| 8 | **Export & support** | The user exports a ReportLab PDF or asks the chat sidebar for help. Admin oversees all of it at any point. |

### Upload request, end to end

```mermaid
sequenceDiagram
    participant U as User
    participant P as CsvAnalysis page
    participant G as services/api.js
    participant F as Flask API
    participant D as MySQL

    U->>P: drops sales.csv
    P->>P: Papa Parse preview (first 6 rows)
    U->>P: Run analysis
    P->>G: analysisApi.upload(file, onProgress)
    G->>F: POST /analysis/upload (multipart + JWT)
    F->>F: validate schema · Pandas parse · clean
    F->>D: INSERT sales records
    F-->>G: 200 { upload }
    P->>G: analysisApi.get({ uploadId })
    G->>F: GET /analysis
    F->>D: SELECT + aggregate
    F-->>G: 200 { kpis, salesByPeriod, branchProfitability, … }
    G-->>P: analysis payload
    P->>U: KPI cards + charts render
```

### The gateway switch

Every call follows the same path. `services/api.js` decides at call time whether to reach Flask or
the in-browser mock, and both return the identical response shape.

```mermaid
flowchart LR
    PG["Page<br/>useEffect"] --> GW["services/api.js"]
    GW -->|VITE_USE_MOCK=true| MK["mockApi.js<br/><i>seeded data + latency</i>"]
    GW -->|VITE_USE_MOCK=false| AX["Axios + JWT"] --> FL["Flask REST"] --> DB[("MySQL")]
    MK --> ST["setState → render"]
    FL --> ST
```

This is why the whole frontend is reviewable before the backend exists. To connect the real API:

```bash
# .env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK=false
```

No component or page changes — only the gateway resolves differently.

---

## Routes and access

| Route | Page | Individual | Enterprise | Team | Admin |
|---|---|:--:|:--:|:--:|:--:|
| `/` | Home | ✓ | ✓ | ✓ | ✓ |
| `/plans` | Feature plans | ✓ | ✓ | ✓ | ✓ |
| `/login` `/register` | Authentication | ✓ | ✓ | ✓ | ✓ |
| `/dashboard` | Dashboard | ✓ | ✓ | ✓ | ✓ |
| `/analysis` | CSV Analysis | ✓ | ✓ | ✓ | ✓ |
| `/account` | My Account | ✓ | ✓ | ✓ | ✓ |
| `/organisation` | Organisation | — | ✓ | ✓ | ✓ |
| `/admin` | Admin | — | — | — | ✓ |

`ProtectedRoute` sends an unauthenticated visitor to `/login` with the attempted path remembered. A
signed-in user without the required role goes to `/dashboard` instead — they are authenticated, just
not permitted there.

---

## Getting started

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

### Demo accounts

The mock backend seeds three accounts, one per role. All share the password **`demo1234`**, and they
are listed as one-click cards on the login page.

| Role | Email | Unlocks |
|---|---|---|
| Individual | `individual@insightmart.dev` | Dashboard, CSV Analysis, My Account, Plans |
| Enterprise | `enterprise@insightmart.dev` | The above, plus Organisation |
| Admin | `admin@insightmart.dev` | Everything, including Admin |

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Serve the built bundle |

---

## Tech stack

**Frontend** — React 18 · Vite 5 · React Router 6 · Axios · Recharts · React Hook Form ·
Tailwind CSS 3 · Framer Motion · Lucide · Papa Parse

**Backend** — Flask · Flask-SQLAlchemy · Flask-Migrate · Flask-JWT-Extended · Flask-CORS · Pandas ·
Marshmallow · ReportLab · Gunicorn

**Database** — MySQL 8 via PyMySQL

Full documentation, including the page-by-page breakdown and design system, is in
[`InsightMart_Frontend_Documentation.pdf`](./InsightMart_Frontend_Documentation.pdf).
