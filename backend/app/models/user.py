# describes our MySQL users table

from app import db

class User(db.Model):
    __tablename__ = "users"

    from app import db

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    plan = db.Column(db.String(20), nullable=False, default="free")
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisations.id"))
    created_at = db.Column(db.DateTime, server_default=db.func.now())