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


if __name__ == "__main__":
    import io

    sample = io.StringIO(
        "Order Date,Product Name,Category,City,Qty,Price,Sales,Cost\n"
        "2024-01-12,Wireless Earbuds,Electronics,Mumbai,2,4299,8598,5300\n"
        "2024-01-12,Wireless Earbuds,Electronics,Mumbai,2,4299,8598,5300\n"
        "2024-02-03,4K Monitor,Electronics,Bengaluru,1,21999,21999,15400\n"
        "2024-02-21,Ceramic Cookware,,Pune,3,6799,20397,12540\n"
        "2024-03-08,Yoga Mat,Sports,Kolkata,4,1899,,3760\n"
        ",Broken Row,Sports,Kolkata,1,500,500,300\n"
        "2024-03-27,Face Serum,Beauty,Chennai,6,2499,14994,5880\n"
        "2024-04-02,Desk Lamp,Home,Delhi,-1,3299,-3299,1740\n"
    )

    data, summary = clean_sales_csv(sample)

    print("Cleaning report")
    for key, value in summary.items():
        print(f"{key:>24}: {value}")

    print("\nCleaned data")
    print(data[["date", "product", "category", "branch",
                "quantity", "revenue", "cost", "profit", "quarter"]])
