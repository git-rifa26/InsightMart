# describes our MySQL users table

from app import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    plan = db.Column(db.String(20), nullable=False, default="free")
    status = db.Column(db.String(20), nullable=False, default="active")
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisations.id"))
    member_role = db.Column(db.String(30))
    uploads_this_month = db.Column(db.Integer, default=0)
    upload_limit = db.Column(db.Integer, default=30)
    last_active = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

