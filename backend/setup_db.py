import argparse
import os
import sys

import pymysql
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Same constant as DEMO_PASSWORD in src/services/mock/mockData.js, so the
# one-click demo buttons on the login page work against the real API.
DEMO_PASSWORD = "demo1234"
ORGANISATION_NAME = "Northwind Retail Group"

ACCOUNTS = [
    {"name": "Ananya Rao", "email": "individual@insightmart.dev",
     "role": "individual", "plan": "free", "upload_limit": 30},
    {"name": "Vikram Shah", "email": "enterprise@insightmart.dev",
     "role": "enterprise", "plan": "enterprise", "upload_limit": 300,
     "member_role": "Lead", "in_org": True, "owner": True},
    {"name": "Kabir Nair", "email": "team@insightmart.dev",
     "role": "member", "plan": "enterprise", "upload_limit": 300,
     "member_role": "Analyst", "in_org": True},
    {"name": "Priya Menon", "email": "admin@insightmart.dev",
     "role": "admin", "plan": "enterprise", "upload_limit": 1000},
]


def create_database():
    """CREATE DATABASE before importing the app, which assumes it exists."""
    name = os.getenv("DB_NAME", "insightmart")
    password = os.getenv("DB_PASSWORD", "")

    if "REPLACE_WITH" in password:
        raise SystemExit(
            "backend/.env still has the placeholder password.\n"
            "Set DB_PASSWORD to your real MySQL root password and run this again."
        )

    try:
        connection = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=password,
            connect_timeout=8,
        )
    except pymysql.err.OperationalError as error:
        raise SystemExit(
            f"Could not reach MySQL: {error}\n"
            "Check that the MySQL80 service is running and that DB_USER / "
            "DB_PASSWORD in backend/.env are correct."
        )

    with connection.cursor() as cursor:
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{name}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
    connection.commit()
    connection.close()
    print(f"Database '{name}' is ready.")


def seed(reset):
    from app import create_app, db
    from app.models.organisation import Organisation
    from app.models.user import User

    app = create_app()

    with app.app_context():
        if reset:
            print("Dropping every table...")
            db.drop_all()

        db.create_all()
        print("Tables: users, organisations, uploads, sale_records")

        organisation = Organisation.query.filter_by(name=ORGANISATION_NAME).first()
        if not organisation:
            organisation = Organisation(name=ORGANISATION_NAME, seat_limit=25)
            db.session.add(organisation)
            db.session.flush()
            print(f"Created organisation: {ORGANISATION_NAME}")

        for spec in ACCOUNTS:
            if User.query.filter_by(email=spec["email"]).first():
                print(f"  exists  {spec['email']}")
                continue

            user = User(
                name=spec["name"],
                email=spec["email"],
                password_hash=DEMO_PASSWORD,
                role=spec["role"],
                plan=spec["plan"],
                status="active",
                upload_limit=spec["upload_limit"],
                uploads_this_month=0,
                member_role=spec.get("member_role"),
                organisation_id=organisation.id if spec.get("in_org") else None,
            )
            db.session.add(user)
            db.session.flush()

            if spec.get("owner"):
                organisation.owner_id = user.id

            print(f"  created {spec['email']:32} {spec['role']}")

        db.session.commit()

    print(f"\nEvery demo account signs in with the password: {DEMO_PASSWORD}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="drop all tables first")
    args = parser.parse_args()

    create_database()
    seed(args.reset)

    print("\nNext:")
    print("  python run.py                                  start the API")
    print('  python scripts/amazon_to_sales.py "<amazon.csv>"  make an uploadable CSV')
    return 0


if __name__ == "__main__":
    sys.exit(main())
