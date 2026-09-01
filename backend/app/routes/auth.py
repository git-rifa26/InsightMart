# handles /auth/register
from flask import Blueprint, request
from flask_jwt_extended import create_access_token

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



@auth_bp.route("/auth/register/enterprise", methods=["POST"])
def register_enterprise():

    from app.models.user import User
    from app.models.organisation import Organisation
    from app import db

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    organisation_name = data.get("organisation_name")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    terms = data.get("terms")

    if not name or not email or not organisation_name:
        return {"error": "Name, email and organisation name are required"}, 400

    if not password or not confirm_password:
        return {"error": "Password and confirm password are required"}, 400

    if password != confirm_password:
        return {"error": "Passwords do not match"}, 400

    if not terms:
        return {"error": "You must accept the terms"}, 400

    existing_organisation = Organisation.query.filter_by(
        name=organisation_name
    ).first()

    if existing_organisation:
        return {"error": "Organisation already exists"}, 409

    organisation = Organisation(
        name=organisation_name
    )
    db.session.add(organisation)
    db.session.flush()

    user = User(
            name=name,
            email=email,
            password_hash=password,
            role="Organisation",
            plan="free",
            organisation_id=organisation.id
        )
    db.session.add(user)
    db.session.commit()

    return{
        "message": "Enterprise account created successfully",
    }, 201


@auth_bp.route("/auth/login/individual", methods=["POST"])
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

    if user.role != "individual":
        return {
            "error": "This account is not an Individual account"
        }, 403

    if user.password_hash != password:
        return {
            "error": "Invalid email or password"
        }, 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
        "role": user.role
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "plan": user.plan
    }, 200

@auth_bp.route("/auth/login/organisation", methods=["POST"])
def login_org():

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

    if user.role != "Organisation":
        return {
            "error": "This account is not an Organisation account"
        }, 403

    if user.password_hash != password:
        return {
            "error": "Invalid email or password"
        }, 401

    access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
            "role": user.role
            }
        )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "plan": user.plan
    }, 200

@auth_bp.route("/auth/login/admin", methods=["POST"])
def login_admin():

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

    if user.role != "admin":
        return {
            "error": "This account is not an Organisation account"
        }, 403

    if user.password_hash != password:
        return {
            "error": "Invalid email or password"
        }, 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
        "role": user.role
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "plan": user.plan
    }, 200