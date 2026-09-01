from app import db


class SaleRecord(db.Model):
    __tablename__ = "sale_records"

    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey("uploads.id"), nullable=False)

    date = db.Column(db.Date, nullable=False)
    product = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), default="Unknown")
    branch = db.Column(db.String(100), default="Unknown")
    region = db.Column(db.String(100), default="Unknown")
    customer_id = db.Column(db.String(100), default="Unknown")

    quantity = db.Column(db.Float, default=1)
    unit_price = db.Column(db.Float)
    revenue = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float)
    profit = db.Column(db.Float)

    year = db.Column(db.Integer)
    month = db.Column(db.String(3))
    month_index = db.Column(db.Integer)
    quarter = db.Column(db.String(2))