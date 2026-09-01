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


def full_analysis(df):
    return {
        "rowsAnalysed": int(len(df)) if df is not None else 0,
        "kpis": compute_kpis(df),
        "revenueTrend": monthly_trend(df),
        "topProducts": top_products(df),
        "categoryShare": category_share(df),
        "branchProfitability": branch_profitability(df),
    }
