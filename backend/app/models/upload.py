from app import db


class Upload(db.Model):
    __tablename__ = "uploads"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    size = db.Column(db.Integer, default=0)
    rows = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="processed")  # processing | processed | failed
    error = db.Column(db.Text)
    has_cost_data = db.Column(db.Boolean, default=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    records = db.relationship("SaleRecord", backref="upload", lazy="dynamic")
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisations.id"))
    uploaded_at = db.Column(db.DateTime, server_default=db.func.now())