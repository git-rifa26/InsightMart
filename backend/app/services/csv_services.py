import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

REQUIRED_COLUMNS = ["date", "product", "revenue"]
NUMERIC_COLUMNS = ["quantity", "unit_price", "revenue", "cost"]
TEXT_COLUMNS = ["product", "category", "branch", "region", "customer_id"]

# Common spellings mapped back to the names we use everywhere else.
COLUMN_ALIASES = {
    "order_date": "date", "invoice_date": "date", "transaction_date": "date",
    "item": "product", "product_name": "product",
    "sales": "revenue", "amount": "revenue", "total": "revenue",
    "qty": "quantity", "units": "quantity",
    "price": "unit_price", "rate": "unit_price",
    "cost_price": "cost", "purchase_cost": "cost",
    "customer": "customer_id", "store": "branch", "city": "branch",
    "zone": "region", "state": "region",
}


class CsvValidationError(Exception):
    """Raised when the uploaded file cannot be used at all."""
    pass


# 1 -------------------------------------------------------------------
def read_csv(file):
    """Read the uploaded CSV. `file` can be a path or a Flask file object."""
    try:
        df = pd.read_csv(file)
    except Exception as error:
        raise CsvValidationError("The file could not be read as a CSV.") from error

    if df.empty:
        raise CsvValidationError("The file is empty.")

    return df


# 1b ------------------------------------------------------------------
# Some files are a product list, not a sales list. amazon.csv is one: it
# has prices and ratings but no dates and no revenue, so it cannot be
# analysed as it stands. The next three functions turn it into orders.

# A catalogue must have at least these two columns.
CATALOGUE_COLUMNS = ["product_name", "discounted_price"]

# Branches we spread the orders across, with the region each one is in.
BRANCHES = [
    ("Mumbai", "West"), ("Pune", "West"), ("Ahmedabad", "West"),
    ("Delhi", "North"), ("Gurugram", "North"), ("Jaipur", "North"),
    ("Bengaluru", "South"), ("Chennai", "South"), ("Hyderabad", "South"),
    ("Kolkata", "East"), ("Bhubaneswar", "East"),
]

# One order for every 3,000 ratings, and never more than 10 per product.
RATINGS_PER_ORDER = 3000
MAX_ORDERS = 10


def money(value):
    """Read a number out of messy text.  '₹1,099' -> 1099.0,  '24,269' -> 24269.0"""
    digits = "".join(c for c in str(value) if c.isdigit() or c == ".")
    try:
        return float(digits)
    except ValueError:
        return None


def looks_like_catalogue(df):
    """True when the file lists products instead of sales."""
    names = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    is_sales_file = "date" in names and ("revenue" in names or "sales" in names)
    return not is_sales_file and all(c in names for c in CATALOGUE_COLUMNS)


def expand_catalogue(df):
    """Build order rows from a product catalogue.

    A catalogue has no dates and no revenue, so we fill those in:
      - orders are spread over the last 12 months
      - a product with more ratings is treated as having sold more
      - the reviewer ids in the file become our customers
      - cost is 55-78% of the price, giving a 22-45% margin

    The random picks are seeded, so the same file always gives the same
    numbers.
    """
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    rng = random.Random(20240917)

    last_month_end = date.today().replace(day=1) - timedelta(days=1)
    start = (last_month_end - timedelta(days=365)).replace(day=1)
    total_days = (last_month_end - start).days

    rows = []
    for _, item in df.iterrows():
        product = str(item.get("product_name") or "").strip()
        price = money(item.get("discounted_price"))
        if not product or not price:
            continue

        # "Computers&Accessories|Cables|USBCables" -> "Computers&Accessories"
        category = str(item.get("category") or "Uncategorised").split("|")[0]

        # user_id holds a comma separated list of real reviewer ids.
        customers = [c.strip() for c in str(item.get("user_id") or "").split(",") if c.strip()]

        ratings = money(item.get("rating_count")) or 0
        order_count = max(1, min(MAX_ORDERS, round(ratings / RATINGS_PER_ORDER)))

        # One buying price per product, so it costs the same everywhere.
        cost_ratio = rng.uniform(0.55, 0.78)

        for _ in range(order_count):
            branch, region = rng.choice(BRANCHES)
            quantity = rng.choice([1, 1, 1, 1, 2, 2, 3, 4])

            if customers:
                customer = rng.choice(customers)
            else:
                customer = "CUST" + str(rng.randint(1000, 9999))

            rows.append({
                "date": start + timedelta(days=rng.randint(0, total_days)),
                "product": product[:180],
                "category": category,
                "branch": branch,
                "region": region,
                "customer_id": customer,
                "quantity": quantity,
                "unit_price": price,
                "revenue": round(price * quantity, 2),
                "cost": round(price * cost_ratio * quantity, 2),
            })

    if not rows:
        raise CsvValidationError("No products with a name and a price were found in that file.")

    return pd.DataFrame(rows)


# 2 -------------------------------------------------------------------
def clean_column_names(df):
    """
    Normalise the headers and check the required ones are present.

    "Order Date" -> "order_date" -> "date"
    """
    names = []
    for name in df.columns:
        clean = str(name).strip().lower().replace(" ", "_").replace("-", "_")
        names.append(COLUMN_ALIASES.get(clean, clean))
    df.columns = names

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise CsvValidationError("Missing required column(s): " + ", ".join(missing))

    return df


# 3 -------------------------------------------------------------------
def convert_types(df):
    """
    Turn text into dates and numbers.

    errors="coerce" turns anything unconvertible into NaN instead of
    crashing. Those NaN values are handled in the next step.
    """
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    for column in NUMERIC_COLUMNS:
        if column in df.columns:
            if df[column].dtype == "object":
                # "Rs 1,200" -> "1200"
                df[column] = df[column].astype(str).str.replace(r"[^0-9.\-]", "", regex=True)
            df[column] = pd.to_numeric(df[column], errors="coerce")

    for column in TEXT_COLUMNS:
        if column in df.columns:
            df[column] = df[column].astype(str).str.strip()

    return df


# 4 -------------------------------------------------------------------
def handle_missing_values(df):
    """
    Fill in what we can and drop what we cannot.

    No date or product -> drop the row.
    Missing quantity   -> assume 1.
    Missing unit_price -> revenue / quantity.
    Missing revenue    -> quantity * unit_price.
    Missing text       -> "Unknown".
    """
    df = df.dropna(subset=["date", "product"]).copy()

    df["quantity"] = df["quantity"].fillna(1) if "quantity" in df.columns else 1

    if "unit_price" in df.columns:
        fill = df["unit_price"].isna() & df["revenue"].notna() & (df["quantity"] > 0)
        df.loc[fill, "unit_price"] = df.loc[fill, "revenue"] / df.loc[fill, "quantity"]

        fill = df["revenue"].isna() & df["unit_price"].notna()
        df.loc[fill, "revenue"] = df.loc[fill, "quantity"] * df.loc[fill, "unit_price"]

    df = df.dropna(subset=["revenue"]).copy()

    for column in TEXT_COLUMNS:
        if column in df.columns:
            df[column] = df[column].replace(["", "nan", "None", "NaN"], np.nan)
            df[column] = df[column].fillna("Unknown")

    return df


# 5 -------------------------------------------------------------------
def remove_bad_rows(df):
    """
    Drop duplicates, impossible sales, and extreme outliers.

    Outliers use the IQR rule, so one mistyped order does not distort
    every average:  keep values between Q1 - 1.5*IQR and Q3 + 1.5*IQR.
    """
    df = df.drop_duplicates().copy()

    df = df[(df["revenue"] > 0) & (df["quantity"] > 0)].copy()

    if "cost" in df.columns:
        df.loc[df["cost"] < 0, "cost"] = np.nan

    if len(df) >= 10:
        q1, q3 = np.percentile(df["revenue"], [25, 75])
        iqr = q3 - q1
        df = df[df["revenue"].between(q1 - 1.5 * iqr, q3 + 1.5 * iqr)].copy()

    return df


# 6 -------------------------------------------------------------------
def add_derived_columns(df):
    """Add the columns the analytics group by: profit, year, month, quarter."""
    df["profit"] = df["revenue"] - df["cost"] if "cost" in df.columns else np.nan
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.strftime("%b")
    df["quarter"] = "Q" + df["date"].dt.quarter.astype(str)
    return df


# 7 -------------------------------------------------------------------
def clean_sales_csv(file):
    """
    The one function the rest of the backend calls.

    Returns the cleaned DataFrame and a summary of what was removed.
    """
    df = read_csv(file)

    # A product list has to become an order list before anything else works.
    if looks_like_catalogue(df):
        df = expand_catalogue(df)

    rows_uploaded = len(df)

    df = clean_column_names(df)
    df = convert_types(df)

    df = handle_missing_values(df)
    after_missing = len(df)

    df = remove_bad_rows(df)
    df = add_derived_columns(df)
    df = df.reset_index(drop=True)

    report = {
        "rows_uploaded": rows_uploaded,
        "rows_kept": len(df),
        "incomplete_rows_removed": rows_uploaded - after_missing,
        "bad_rows_removed": after_missing - len(df),
        "has_cost_data": bool(df["profit"].notna().any()),
        "columns": list(df.columns),
    }

    return df, report
