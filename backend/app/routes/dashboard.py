from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard/individual", methods=["GET"])
@jwt_required()
def individual_dashboard():

    from app.models.user import User

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return {
            "error": "User not found"
        }, 404

    if user.role != "individual":
        return {
            "error": "This is not an Individual account"
        }, 403

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "plan": user.plan
        }
    }, 200


@dashboard_bp.route("/dashboard/organisation", methods=["GET"])
@jwt_required()
def organisation_dashboard():

    from app.models.user import User
    from app.models.organisation import Organisation

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return {
            "error": "User not found"
        }, 404

    if user.role != "Organisation":
        return {
            "error": "This is not an Organisation account"
        }, 403

    organisation = Organisation.query.get(user.organisation_id)

    if not organisation:
        return {
            "error": "Organisation not found"
        }, 404

    return {
        "organisation": {
            "id": organisation.id,
            "name": organisation.name
        },
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "plan": user.plan
        }
    }, 200

@dashboard_bp.route("/dashboard/admin", methods=["GET"])
@jwt_required()
def admin_dashboard():

    from app.models.user import User
    from app.models.organisation import Organisation

    user_id = get_jwt_identity()

    # Find logged-in admin
    admin = User.query.get(user_id)

    if not admin:
        return {
            "error": "User not found"
        }, 404

    # Make sure this is an admin account
    if admin.role != "admin":
        return {
            "error": "Admin access required"
        }, 403

    # System statistics
    total_users = User.query.count()
    total_organisations = Organisation.query.count()

    individual_users = User.query.filter_by(
        role="individual"
    ).count()

    organisation_users = User.query.filter_by(
        role="Organisation"
    ).count()

    admin_users = User.query.filter_by(
        role="admin"
    ).count()

    return {
        "admin": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email
        },

        "statistics": {
            "total_users": total_users,
            "total_organisations": total_organisations,
            "individual_users": individual_users,
            "organisation_users": organisation_users,
            "admin_users": admin_users
        }
    }, 200