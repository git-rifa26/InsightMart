from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/", methods=["GET"])
@jwt_required()
def get_dashboard():
    from app.models.user import User
    from app.models.organisation import Organisation

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {"message": "User not found"}, 404

    organisation = None
    if user.organisation_id:
        organisation = Organisation.query.get(user.organisation_id)

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "plan": user.plan,
        },
        "organisation": {"id": organisation.id, "name": organisation.name} if organisation else None,
    }, 200