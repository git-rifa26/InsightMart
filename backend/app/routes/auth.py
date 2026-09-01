# handles /auth/register
from flask import Blueprint, request
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)

def user_payload(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "plan": user.plan,
        "status": user.status,
        "organisationId": user.organisation_id,
        "uploadsThisMonth": user.uploads_this_month,
        "uploadLimit": user.upload_limit,
    }

@auth_bp.route("/register", methods=["POST"])
def register():

    from app.models.user import User
    from app.models.organisation import Organisation
    from app import db

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    account_type = data.get("accountType", "individual")
    organisation_name = data.get("organisationName")

    if not name or not email or not password:
        return {"error": "All fields are required"}, 400

    if User.query.filter_by(email=email).first():
        return {"message": "An account with that email already exists."}, 409

    is_enterprise = account_type == "enterprise"
    role = "enterprise" if is_enterprise else "individual"


    user = User(
        name=name,
        email=email,
        password_hash=password,
        role=role,
        plan="enterprise" if is_enterprise else "free",
        upload_limit=300 if is_enterprise else 30,
    )
    db.session.add(user)
    db.session.flush()

    if is_enterprise:
        if not organisation_name:
            db.session.rollback()
            return {"message": "Organisation name is required for enterprise accounts."}, 400
        organisation = Organisation(name=organisation_name, owner_id=user.id)
        db.session.add(organisation)
        db.session.flush()
        user.organisation_id = organisation.id

    db.session.commit()

    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})

    return {"user": user_payload(user), "access_token": access_token}

    

@auth_bp.route("/login", methods=["POST"])
def login():

    from app.models.user import User

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {
            "error": "Email and password are required"
        }, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return {
            "error": "Invalid email or password"
        }, 401

    if user.password_hash != password:
        return {
            "error": "Invalid email or password"
        }, 401

    if user.status == "suspended":
        return {"message": "This account has been suspended."}, 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
        "role": user.role
        }
    )

    return {
        "user": user_payload(user), 
        "access_token": access_token
        }

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return {"ok": True}