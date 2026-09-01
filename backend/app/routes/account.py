from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

account_bp = Blueprint("account", __name__)


@account_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    from app.models.user import User

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    return {
        "user": {
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
    }, 200


@account_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    from app.models.user import User
    from app import db

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    data = request.get_json()

    if data.get("name"):
        user.name = data["name"]

    if data.get("email"):
        new_email = data["email"]
        clash = User.query.filter(User.email == new_email, User.id != user.id).first()
        if clash:
            return {"message": "Another account already uses that email address."}, 409
        user.email = new_email

    db.session.commit()

    return {
        "user": {
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
    }, 200


@account_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    from app.models.user import User
    from app import db

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    data = request.get_json()
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    if user.password_hash != current_password:
        return {"message": "Your current password does not match our records."}, 400

    if not new_password or len(new_password) < 8:
        return {"message": "New password must be at least 8 characters."}, 400

    user.password_hash = new_password
    db.session.commit()

    return {"message": "Password updated."}, 200


@account_bp.route("/subscription", methods=["POST"])
@jwt_required()
def change_plan():
    from app.models.user import User
    from app import db

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    data = request.get_json()
    plan_id = data.get("planId")

    if plan_id not in ("free", "pro", "enterprise"):
        return {"message": "That plan does not exist."}, 400

    user.plan = plan_id
    db.session.commit()

    return {
        "user": {
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
    }, 200