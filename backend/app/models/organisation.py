from app import db


class Organisation(db.Model):
    __tablename__ = "organisations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    seat_limit = db.Column(db.Integer, default=25)
    created_at = db.Column(db.DateTime, server_default=db.func.now())