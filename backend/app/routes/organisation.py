from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

organisation_bp = Blueprint("organisation", __name__)

MEMBER_ROLES = ("Lead", "Analyst", "Viewer")


def member_payload(member):
    return {
        "id": member.id,
        "name": member.name,
        "email": member.email,
        "role": member.member_role or "Viewer",
        "status": member.status,
        "lastActive": member.last_active.isoformat() if member.last_active else None,
    }


@organisation_bp.route("", methods=["GET"])
@jwt_required()
def get_organisation():
    from app.models.user import User
    from app.models.organisation import Organisation

    user = User.query.get(get_jwt_identity())
    if not user or not user.organisation_id:
        return {"message": "You are not part of an organisation."}, 404

    organisation = Organisation.query.get(user.organisation_id)
    members = User.query.filter_by(organisation_id=organisation.id).all()

    return {
        "organisation": {
            "id": organisation.id,
            "name": organisation.name,
            "seatLimit": organisation.seat_limit,
            "seatsUsed": len(members),
            "ownerId": organisation.owner_id,
            "members": [member_payload(m) for m in members],
        }
    }, 200


@organisation_bp.route("/members", methods=["POST"])
@jwt_required()
def invite_member():
    from app.models.user import User
    from app import db

    user = User.query.get(get_jwt_identity())
    if not user or not user.organisation_id:
        return {"message": "You are not part of an organisation."}, 404
    if user.role not in ("enterprise", "admin"):
        return {"message": "You do not have permission to do that."}, 403

    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    role = data.get("role", "Viewer")

    if not name or not email:
        return {"message": "Name and email are required."}, 400
    if role not in MEMBER_ROLES:
        return {"message": "Invalid role."}, 400
    if User.query.filter_by(email=email).first():
        return {"message": "That person is already part of this organisation."}, 409

    member = User(
        name=name,
        email=email,
        password_hash="changeme123",  # placeholder until they set their own on first login
        role="member",
        plan=user.plan,
        status="invited",
        organisation_id=user.organisation_id,
        member_role=role,
        upload_limit=300,
    )
    db.session.add(member)
    db.session.commit()

    return {"member": member_payload(member)}, 200


@organisation_bp.route("/members/<int:member_id>", methods=["PUT"])
@jwt_required()
def update_member_role(member_id):
    from app.models.user import User
    from app import db

    user = User.query.get(get_jwt_identity())
    if not user or not user.organisation_id:
        return {"message": "You are not part of an organisation."}, 404
    if user.role not in ("enterprise", "admin"):
        return {"message": "You do not have permission to do that."}, 403

    member = User.query.filter_by(id=member_id, organisation_id=user.organisation_id).first()
    if not member:
        return {"message": "That member no longer exists."}, 404

    role = request.get_json().get("role")
    if role not in MEMBER_ROLES:
        return {"message": "Invalid role."}, 400

    member.member_role = role
    db.session.commit()

    members = User.query.filter_by(organisation_id=user.organisation_id).all()
    return {"members": [member_payload(m) for m in members]}, 200


@organisation_bp.route("/members/<int:member_id>", methods=["DELETE"])
@jwt_required()
def remove_member(member_id):
    from app.models.user import User
    from app.models.organisation import Organisation
    from app import db

    user = User.query.get(get_jwt_identity())
    if not user or not user.organisation_id:
        return {"message": "You are not part of an organisation."}, 404
    if user.role not in ("enterprise", "admin"):
        return {"message": "You do not have permission to do that."}, 403

    member = User.query.filter_by(id=member_id, organisation_id=user.organisation_id).first()
    if not member:
        return {"message": "That member no longer exists."}, 404

    organisation = Organisation.query.get(user.organisation_id)
    if member.id == organisation.owner_id:
        return {"message": "The organisation owner cannot be removed."}, 400

    db.session.delete(member)
    db.session.commit()

    members = User.query.filter_by(organisation_id=user.organisation_id).all()
    return {"members": [member_payload(m) for m in members]}, 200