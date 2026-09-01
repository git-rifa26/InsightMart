# handles /auth/register
from flask import Blueprint, request

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/register/indivisual", methods=["POST"])
def register():

    from app.models.user import User
    from app import db

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    terms = data.get("terms")

    if not name or not email or not password or not confirm_password:
        return {"error": "All fields are required"}, 400

    if password != confirm_password:
        return {"error": "Passwords do not match"}, 400

    if not terms:
        return {"error": "You must accept the terms"}, 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return {"error": "Email already registered"}, 409

    user = User(
        name=name,
        email=email,
        password_hash=password,
        role="individual",
        plan="free",
        organisation_id=None
    )

    db.session.add(user)
    db.session.commit()

    
    return {"message": "Validation Successful"}