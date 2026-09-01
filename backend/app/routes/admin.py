from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint("admin", __name__)


def require_admin():
    from app.models.user import User

    user = User.query.get(get_jwt_identity())
    if not user or user.role != "admin":
        return None
    return user


@admin_bp.route("/overview", methods=["GET"])
@jwt_required()
def overview():
    from app.models.user import User
    from app.models.organisation import Organisation
    from app.models.upload import Upload

    admin = require_admin()
    if not admin:
        return {"message": "You do not have permission to do that."}, 403

    users = User.query.all()
    organisations = Organisation.query.all()
    uploads = Upload.query.order_by(Upload.uploaded_at.desc()).limit(50).all()

    return {
        "stats": {
            "users": len(users),
            "organisations": len(organisations),
            "uploads": Upload.query.count(),
            "activeSubscriptions": sum(1 for u in users if u.plan != "free"),
        },
        "users": [
            {
                "id": u.id, "name": u.name, "email": u.email, "role": u.role,
                "plan": u.plan, "status": u.status, "uploadsThisMonth": u.uploads_this_month,
            }
            for u in users
        ],
        "organisations": [
            {"id": o.id, "name": o.name, "seatLimit": o.seat_limit} for o in organisations
        ],
        "uploads": [
            {"id": up.id, "filename": up.filename, "rows": up.rows, "status": up.status}
            for up in uploads
        ],
    }, 200


@admin_bp.route("/users/<int:user_id>/status", methods=["PUT"])
@jwt_required()
def set_user_status(user_id):
    from app.models.user import User
    from app import db

    admin = require_admin()
    if not admin:
        return {"message": "You do not have permission to do that."}, 403

    target = User.query.get(user_id)
    if not target:
        return {"message": "That user no longer exists."}, 404

    status = request.get_json().get("status")
    if status not in ("active", "invited", "suspended"):
        return {"message": "Invalid status."}, 400

    target.status = status
    db.session.commit()

    return {"user": {"id": target.id, "status": target.status}}, 200


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    from app.models.user import User
    from app import db

    admin = require_admin()
    if not admin:
        return {"message": "You do not have permission to do that."}, 403

    target = User.query.get(user_id)
    if not target:
        return {"message": "That user no longer exists."}, 404

    data = request.get_json()
    for field in ("name", "role", "plan", "status"):
        if data.get(field):
            setattr(target, field, data[field])

    if data.get("email"):
        clash = User.query.filter(User.email == data["email"], User.id != user_id).first()
        if clash:
            return {"message": "Another account already uses that email address."}, 409
        target.email = data["email"]

    db.session.commit()

    return {"user": {"id": target.id, "name": target.name, "email": target.email}}, 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    from app.models.user import User
    from app import db

    admin = require_admin()
    if not admin:
        return {"message": "You do not have permission to do that."}, 403

    target = User.query.get(user_id)
    if not target:
        return {"message": "That user no longer exists."}, 404

    db.session.delete(target)
    db.session.commit()

    return {"user": {"id": user_id}}, 200


@admin_bp.route("/organisations/<int:org_id>", methods=["DELETE"])
@jwt_required()
def delete_organisation(org_id):
    from app.models.organisation import Organisation
    from app import db

    admin = require_admin()
    if not admin:
        return {"message": "You do not have permission to do that."}, 403

    organisation = Organisation.query.get(org_id)
    if not organisation:
        return {"message": "That organisation no longer exists."}, 404

    db.session.delete(organisation)
    db.session.commit()

    return {"organisation": {"id": org_id}}, 200


@admin_bp.route("/uploads/<int:upload_id>", methods=["DELETE"])
@jwt_required()
def delete_upload(upload_id):
    from app.models.upload import Upload
    from app import db

    admin = require_admin()
    if not admin:
        return {"message": "You do not have permission to do that."}, 403

    upload = Upload.query.get(upload_id)
    if not upload:
        return {"message": "That upload no longer exists."}, 404

    db.session.delete(upload)
    db.session.commit()

    return {"upload": {"id": upload_id}}, 200