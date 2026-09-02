"""Convert the Amazon product-review export into an InsightMart sales CSV.

amazon.csv is a *catalogue* — one row per product, with prices, a category
path and the reviewers who rated it. InsightMart analyses a *sales ledger* —
one row per order, with a date, a branch and a revenue figure. This script
bridges the two.

What is taken straight from the file
    product      product_name
    category     the top level of the pipe-delimited category path
    unit_price   discounted_price (the rupee symbol and commas are stripped)
    customer_id  a real reviewer id from that product's user_id list

What is synthesised, and on what assumption
    date         orders are spread over the trailing 12 months, so the
                 monthly charts have something to plot
    order count  scaled from rating_count — a product with 40,000 ratings
                 sold more than one with 200
    quantity     1-4 units, weighted towards 1
    branch/region  drawn from a fixed list of Indian cities
    cost         55-78% of the selling price, i.e. a 22-45% gross margin

The randomness is seeded, so the same amazon.csv always produces the same
sales file and the numbers on screen are reproducible.

Usage
    python scripts/amazon_to_sales.py <path-to-amazon.csv> [-o output.csv]
"""

import argparse
import os
import random
import sys
from datetime import date, timedelta

import pandas as pd

SEED = 20240917
MONTHS_OF_HISTORY = 12

# Branch -> region, so branch profitability rolls up into regional revenue.
BRANCHES = [
    ("Mumbai", "West"), ("Pune", "West"), ("Ahmedabad", "West"),
    ("Delhi", "North"), ("Gurugram", "North"), ("Jaipur", "North"),
    ("Bengaluru", "South"), ("Chennai", "South"), ("Hyderabad", "South"),
    ("Kolkata", "East"), ("Bhubaneswar", "East"),
]
# Metros carry more of the volume than the smaller branches.
BRANCH_WEIGHTS = [16, 9, 7, 15, 8, 6, 17, 10, 9, 8, 5]

QUANTITY_CHOICES = [1, 2, 3, 4]
QUANTITY_WEIGHTS = [62, 22, 11, 5]

MAX_ORDERS_PER_PRODUCT = 10
RATINGS_PER_ORDER = 3_000  # one synthetic order per 3,000 ratings


def to_number(value):
    """'₹1,099' -> 1099.0 ; '43,994' -> 43994.0 ; anything else -> None."""
    if value is None:
        return None
    text = str(value)
    cleaned = "".join(character for character in text if character.isdigit() or character == ".")
    if not cleaned or cleaned == ".":
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def top_category(path):
    """'Computers&Accessories|Cables|USBCables' -> 'Computers & Accessories'."""
    if not isinstance(path, str) or not path.strip():
        return "Uncategorised"
    head = path.split("|")[0]
    # The source packs words together: split CamelCase back apart.
    spaced = ""
    for index, character in enumerate(head):
        if index and character.isupper() and not head[index - 1].isupper():
            spaced += " "
        spaced += character
    return spaced.replace("&", " & ").replace("  ", " ").strip()


def reviewer_ids(raw):
    """The user_id column is a comma-separated list of real reviewer ids."""
    if not isinstance(raw, str):
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


def order_count(rating_count):
    """More ratings means more orders, flattened so one product cannot
    dominate the whole dataset."""
    if not rating_count:
        return 1
    return max(1, min(MAX_ORDERS_PER_PRODUCT, round(rating_count / RATINGS_PER_ORDER)))


def build_sales_rows(source_path):
    rng = random.Random(SEED)
    catalogue = pd.read_csv(source_path)

    required = {"product_name", "discounted_price"}
    missing = required - set(catalogue.columns)
    if missing:
        raise SystemExit(f"{source_path} is missing column(s): {', '.join(sorted(missing))}")

    end = date.today().replace(day=1) - timedelta(days=1)  # end of last month
    start = (end - timedelta(days=365)).replace(day=1)
    window_days = (end - start).days

    # A shared pool so customers recur across products, which is what makes
    # the repeat-purchase rate and the retention chart meaningful.
    customer_pool = []

    rows = []
    for _, product in catalogue.iterrows():
        name = str(product.get("product_name") or "").strip()
        price = to_number(product.get("discounted_price"))
        if not name or not price:
            continue

        category = top_category(product.get("category"))
        reviewers = reviewer_ids(product.get("user_id"))
        customer_pool.extend(reviewers[:4])

        # One cost ratio per product: the same item is bought in at the same
        # price wherever it sells.
        cost_ratio = rng.uniform(0.55, 0.78)

        for _ in range(order_count(to_number(product.get("rating_count")))):
            branch, region = rng.choices(BRANCHES, weights=BRANCH_WEIGHTS, k=1)[0]
            quantity = rng.choices(QUANTITY_CHOICES, weights=QUANTITY_WEIGHTS, k=1)[0]

            if reviewers and rng.random() < 0.75:
                customer = rng.choice(reviewers)
            elif customer_pool:
                customer = rng.choice(customer_pool)
            else:
                customer = f"CUST{rng.randint(1000, 9999)}"

            rows.append({
                "date": (start + timedelta(days=rng.randint(0, window_days))).isoformat(),
                "product": name[:180],
                "category": category,
                "branch": branch,
                "region": region,
                "customer_id": customer,
                "quantity": quantity,
                "unit_price": round(price, 2),
                "revenue": round(price * quantity, 2),
                "cost": round(price * cost_ratio * quantity, 2),
            })

    if not rows:
        raise SystemExit("No usable products found in the source file.")

    frame = pd.DataFrame(rows).sort_values("date").reset_index(drop=True)
    return frame


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="Path to amazon.csv")
    parser.add_argument(
        "-o", "--output",
        default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "data", "amazon_sales.csv"),
        help="Where to write the InsightMart-shaped CSV",
    )
    args = parser.parse_args()

    frame = build_sales_rows(args.source)
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    frame.to_csv(args.output, index=False)

    revenue = frame["revenue"].sum()
    print(f"Wrote {len(frame):,} order rows to {args.output}")
    print(f"  products      {frame['product'].nunique():,}")
    print(f"  customers     {frame['customer_id'].nunique():,}")
    print(f"  date range    {frame['date'].min()} to {frame['date'].max()}")
    print(f"  total revenue Rs {revenue:,.0f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
