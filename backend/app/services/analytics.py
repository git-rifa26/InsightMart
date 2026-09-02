import numpy as np
import pandas as pd

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

COLUMNS = [
    "date", "product", "category", "branch", "region", "customer_id",
    "quantity", "unit_price", "revenue", "cost", "profit",
    "year", "month", "month_index", "quarter",
]


def records_to_df(records):
    rows = [{c: getattr(r, c) for c in COLUMNS} for r in records]
    df = pd.DataFrame(rows, columns=COLUMNS)
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["date"])
    for col in ["quantity", "revenue", "cost", "profit"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def compute_kpis(df):
    if df is None or len(df) == 0:
        return {"revenue": 0, "profit": 0, "orders": 0, "customers": 0, "aov": 0, "margin": 0, "repeatRate": 0}

    revenue = float(df["revenue"].sum())
    profit = float(df["profit"].fillna(0).sum())
    orders = int(len(df))
    counts = df["customer_id"].value_counts()
    unique_customers = int(counts.shape[0])
    repeat = int((counts > 1).sum())

    return {
        "revenue": revenue,
        "profit": profit,
        "orders": orders,
        "customers": unique_customers,
        "aov": revenue / orders if orders else 0,
        "margin": (profit / revenue * 100) if revenue else 0,
        "repeatRate": (repeat / unique_customers * 100) if unique_customers else 0,
    }


def monthly_trend(df):
    if df is None or len(df) == 0:
        return [{"name": m, "revenue": 0, "profit": 0, "orders": 0} for m in MONTHS]

    out = []
    for idx, label in enumerate(MONTHS):
        rows = df[df["month_index"] == idx]
        out.append({
            "name": label,
            "revenue": float(rows["revenue"].sum()),
            "profit": float(rows["profit"].fillna(0).sum()),
            "orders": int(len(rows)),
        })
    return out


def top_products(df, limit=6):
    if df is None or len(df) == 0:
        return []
    grouped = df.groupby("product")["revenue"].sum().sort_values(ascending=False).head(limit)
    return [{"name": name, "revenue": float(value)} for name, value in grouped.items()]


def category_share(df):
    if df is None or len(df) == 0:
        return []
    grouped = df.groupby("category")["revenue"].sum().sort_values(ascending=False)
    return [{"name": name, "revenue": float(value)} for name, value in grouped.items()]


def branch_profitability(df):
    if df is None or len(df) == 0:
        return []
    grouped = df.groupby("branch").agg(revenue=("revenue", "sum"), profit=("profit", "sum")).reset_index()
    out = []
    for _, row in grouped.iterrows():
        revenue = float(row["revenue"])
        profit = float(row["profit"]) if row["profit"] == row["profit"] else 0
        out.append({"name": row["branch"], "revenue": revenue, "profit": profit,
                     "margin": (profit / revenue * 100) if revenue else 0})
    return sorted(out, key=lambda r: r["revenue"], reverse=True)


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
    return {
        "rowsAnalysed": int(len(df)) if df is not None else 0,
        "kpis": compute_kpis(df),
        "revenueTrend": monthly_trend(df),
        "topProducts": top_products(df),
        "categoryShare": category_share(df),
        "branchProfitability": branch_profitability(df),
        "salesByPeriod": sales_by_period(df),
        "regionShare": region_share(df),
        "orderValueHistogram": order_value_histogram(df),
        "retention": retention(df),
    }