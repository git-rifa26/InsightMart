import pandas as pd

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

COLUMNS = [
    "date", "product", "category", "branch", "region", "customer_id",
    "quantity", "unit_price", "revenue", "cost", "profit",
    "year", "month", "month_index", "quarter",
]

# Value bands for the order histogram. None as the top means "no upper limit".
BUCKETS = [
    ("0-2K", 0, 2000),
    ("2-5K", 2000, 5000),
    ("5-10K", 5000, 10000),
    ("10-20K", 10000, 20000),
    ("20-40K", 20000, 40000),
    ("40K+", 40000, None),
]

DELTA_KEYS = ["revenue", "orders", "aov", "customers", "margin", "repeatRate"]


def records_to_df(records):
    rows = [{c: getattr(r, c) for c in COLUMNS} for r in records]
    df = pd.DataFrame(rows, columns=COLUMNS)
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["date"])
    for col in ["quantity", "revenue", "cost", "profit"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def is_empty(df):
    """True when there is nothing to analyse."""
    return df is None or len(df) == 0


# ---------------------------------------------------------------------
# KPIs
# ---------------------------------------------------------------------

def basic_kpis(df):
    """The headline numbers for one set of rows."""
    revenue = float(df["revenue"].sum())
    profit = float(df["profit"].fillna(0).sum())
    orders = len(df)

    counts = df["customer_id"].value_counts()
    customers = len(counts)
    repeat = int((counts > 1).sum())

    return {
        "revenue": revenue,
        "profit": profit,
        "orders": orders,
        "customers": customers,
        "aov": revenue / orders if orders else 0,
        "margin": (profit / revenue * 100) if revenue else 0,
        "repeatRate": (repeat / customers * 100) if customers else 0,
    }


def percent_change(now, before):
    """How much a number grew or shrank, in percent."""
    if not before:
        return 0
    return round((now - before) / before * 100, 1)


def compute_kpis(df):
    """Headline numbers plus the up/down arrows on the KPI cards."""
    if is_empty(df):
        return {
            "revenue": 0, "profit": 0, "orders": 0, "customers": 0,
            "aov": 0, "margin": 0, "repeatRate": 0,
            "deltas": {key: 0 for key in DELTA_KEYS},
        }

    kpis = basic_kpis(df)
    deltas = {key: 0 for key in DELTA_KEYS}

    # Compare the newest month that has data against the month before it.
    months = sorted(df["month_index"].dropna().unique())
    if len(months) >= 2:
        this_month = basic_kpis(df[df["month_index"] == months[-1]])
        last_month = basic_kpis(df[df["month_index"] == months[-2]])
        for key in DELTA_KEYS:
            deltas[key] = percent_change(this_month[key], last_month[key])

    kpis["deltas"] = deltas
    return kpis


# ---------------------------------------------------------------------
# Trends over time
# ---------------------------------------------------------------------

def totals(rows, name):
    """One bar or point on a chart: the totals for a group of rows."""
    return {
        "name": name,
        "revenue": float(rows["revenue"].sum()),
        "profit": float(rows["profit"].fillna(0).sum()),
        "orders": len(rows),
    }


def empty_trend(labels):
    return [{"name": label, "revenue": 0, "profit": 0, "orders": 0} for label in labels]


def monthly_trend(df):
    if is_empty(df):
        return empty_trend(MONTHS)
    return [totals(df[df["month_index"] == i], month) for i, month in enumerate(MONTHS)]


def quarterly_trend(df):
    if is_empty(df):
        return empty_trend(QUARTERS)
    return [totals(df[df["quarter"] == quarter], quarter) for quarter in QUARTERS]


def yearly_trend(df):
    if is_empty(df):
        return []
    years = sorted(df["year"].dropna().unique())
    return [totals(df[df["year"] == year], str(int(year))) for year in years]


# ---------------------------------------------------------------------
# Breakdowns by product, category, region and branch
# ---------------------------------------------------------------------

def group_totals(df, column, limit=None):
    """Totals for every value in a column, biggest revenue first."""
    if is_empty(df):
        return []

    out = []
    for name, rows in df.groupby(column):
        out.append({
            "name": str(name),
            "revenue": float(rows["revenue"].sum()),
            "profit": float(rows["profit"].fillna(0).sum()),
            "quantity": float(rows["quantity"].fillna(0).sum()),
            "orders": len(rows),
        })

    out.sort(key=lambda item: item["revenue"], reverse=True)
    return out[:limit] if limit else out


def top_products(df, limit=6):
    return group_totals(df, "product", limit)


def category_share(df):
    return group_totals(df, "category")


def region_share(df):
    return group_totals(df, "region")


def branch_profitability(df):
    """Revenue set against cost per branch, so you can see where sales pay off."""
    if is_empty(df):
        return []

    out = []
    for name, rows in df.groupby("branch"):
        revenue = float(rows["revenue"].sum())
        profit = float(rows["profit"].fillna(0).sum())
        out.append({
            "name": str(name),
            "region": str(rows["region"].iloc[0]),
            "revenue": revenue,
            "cost": float(rows["cost"].fillna(0).sum()),
            "profit": profit,
            "margin": (profit / revenue * 100) if revenue else 0,
            "orders": len(rows),
        })

    out.sort(key=lambda item: item["revenue"], reverse=True)
    return out


# ---------------------------------------------------------------------
# Distribution and retention
# ---------------------------------------------------------------------

def order_value_histogram(df):
    """How many orders fall into each value band."""
    out = []
    for name, low, high in BUCKETS:
        if is_empty(df):
            count = 0
        elif high is None:
            count = int((df["revenue"] >= low).sum())
        else:
            count = int(((df["revenue"] >= low) & (df["revenue"] < high)).sum())
        out.append({"name": name, "count": count})
    return out


def retention_trend(df):
    """New against returning customers, month by month.

    A customer is "new" the first month they buy and "returning" every
    month after that.
    """
    if is_empty(df):
        return [{"name": month, "newCustomers": 0, "returning": 0} for month in MONTHS]

    seen = set()
    out = []
    for index, month in enumerate(MONTHS):
        rows = df[df["month_index"] == index]
        new_customers = 0
        returning = 0

        for customer in rows["customer_id"]:
            if customer in seen:
                returning += 1
            else:
                new_customers += 1
                seen.add(customer)

        out.append({"name": month, "newCustomers": new_customers, "returning": returning})
    return out


# ---------------------------------------------------------------------
# What the routes call
# ---------------------------------------------------------------------

def filter_by_range(df, date_range):
    """Keep only the last 1, 3, 6 or 12 months, counted from the newest sale."""
    months = {"30d": 1, "90d": 3, "6m": 6, "12m": 12}.get(date_range, 12)
    if is_empty(df) or months == 12:
        return df

    cutoff = df["date"].max() - pd.DateOffset(months=months)
    return df[df["date"] > cutoff]


def sales_by_period(df):
    """Revenue/profit/orders bucketed by month, quarter and year.
    Powers the Monthly / Quarterly / Yearly tabs on CSV Analysis."""
    empty = {"monthly": [], "quarterly": [], "yearly": []}
    if df is None or len(df) == 0:
        return empty

    monthly = monthly_trend(df)  # already computed elsewhere, reuse it

    quarterly = []
    q_grouped = df.groupby(["year", "quarter"]).agg(
        revenue=("revenue", "sum"), profit=("profit", "sum"), orders=("revenue", "size")
    ).reset_index().sort_values(["year", "quarter"])
    for _, row in q_grouped.iterrows():
        quarterly.append({
            "name": f"{row['quarter']} {int(row['year'])}",
            "revenue": float(row["revenue"]),
            "profit": float(row["profit"]) if row["profit"] == row["profit"] else 0,
            "orders": int(row["orders"]),
        })

    yearly = []
    y_grouped = df.groupby("year").agg(
        revenue=("revenue", "sum"), profit=("profit", "sum"), orders=("revenue", "size")
    ).reset_index().sort_values("year")
    for _, row in y_grouped.iterrows():
        yearly.append({
            "name": str(int(row["year"])),
            "revenue": float(row["revenue"]),
            "profit": float(row["profit"]) if row["profit"] == row["profit"] else 0,
            "orders": int(row["orders"]),
        })

    return {"monthly": monthly, "quarterly": quarterly, "yearly": yearly}


def region_share(df):
    """Same shape as category_share, grouped by region instead."""
    if df is None or len(df) == 0:
        return []
    grouped = df.groupby("region").agg(revenue=("revenue", "sum"), profit=("profit", "sum")).reset_index()
    out = []
    for _, row in grouped.iterrows():
        revenue = float(row["revenue"])
        profit = float(row["profit"]) if row["profit"] == row["profit"] else 0
        out.append({"name": row["region"], "revenue": revenue, "profit": profit})
    return sorted(out, key=lambda r: r["revenue"], reverse=True)


def order_value_histogram(df, bin_count=8):
    """Buckets per-order revenue into fixed-width bins for the histogram chart."""
    if df is None or len(df) == 0:
        return []

    values = df["revenue"].dropna()
    if values.empty:
        return []

    if values.min() == values.max():
        return [{"bucket": f"{values.min():.0f}", "count": int(len(values))}]

    bins = pd.cut(values, bins=bin_count)
    counts = bins.value_counts().sort_index()

    out = []
    for interval, count in counts.items():
        out.append({
            "bucket": f"{interval.left:.0f}-{interval.right:.0f}",
            "count": int(count),
        })
    return out


def retention(df):
    """New vs returning customers per calendar month, plus overall repeat rate."""
    empty = {"monthly": [{"name": m, "new": 0, "returning": 0} for m in MONTHS], "repeatRate": 0}
    if df is None or len(df) == 0:
        return empty

    first_purchase = df.groupby("customer_id")["date"].min().rename("first_purchase")
    merged = df.merge(first_purchase, on="customer_id")
    merged["is_new"] = merged["date"].dt.to_period("M") == merged["first_purchase"].dt.to_period("M")

    monthly = []
    for idx, label in enumerate(MONTHS):
        rows = merged[merged["month_index"] == idx]
        new_count = int(rows[rows["is_new"]]["customer_id"].nunique())
        returning_count = int(rows[~rows["is_new"]]["customer_id"].nunique())
        monthly.append({"name": label, "new": new_count, "returning": returning_count})

    counts = df["customer_id"].value_counts()
    unique_customers = int(counts.shape[0])
    repeat = int((counts > 1).sum())
    repeat_rate = (repeat / unique_customers * 100) if unique_customers else 0

    return {"monthly": monthly, "repeatRate": repeat_rate}


def full_analysis(df):
    """Everything the CSV Analysis page draws."""
    return {
        "rowsAnalysed": 0 if is_empty(df) else len(df),
        "hasCostData": False if is_empty(df) else bool(df["profit"].notna().any()),
        "kpis": compute_kpis(df),
        "salesByPeriod": {
            "month": monthly_trend(df),
            "quarter": quarterly_trend(df),
            "year": yearly_trend(df),
        },
        "revenueTrend": monthly_trend(df),
        "topProducts": top_products(df),
        "categoryShare": category_share(df),
        "regionShare": region_share(df),
        "orderValueHistogram": order_value_histogram(df),
        "retention": retention_trend(df),
        "branchProfitability": branch_profitability(df),
        "salesByPeriod": sales_by_period(df),
        "regionShare": region_share(df),
        "orderValueHistogram": order_value_histogram(df),
        "retention": retention(df),
    }