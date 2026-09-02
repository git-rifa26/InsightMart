from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/", methods=["GET"])
@jwt_required()
def get_dashboard():
    from app.models.user import User
    from app.models.organisation import Organisation
    from app.models.upload import Upload
    from app.models.sales import SaleRecord
    from app.services.analytics import (
        records_to_df, compute_kpis, monthly_trend, top_products,
        category_share, region_share, branch_profitability,
    )

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return {"message": "User not found"}, 404

    organisation = None
    if user.organisation_id:
        organisation = Organisation.query.get(user.organisation_id)

    # Pull every processed upload belonging to this user (or their whole
    # organisation, if they're on a team), same scoping rule used on
    # GET /api/analysis when no uploadId is given.
    upload_query = Upload.query.filter_by(status="processed")
    if user.organisation_id:
        upload_query = upload_query.filter_by(organisation_id=user.organisation_id)
    else:
        upload_query = upload_query.filter_by(uploaded_by=user.id)

    uploads = upload_query.order_by(Upload.uploaded_at.desc()).all()
    upload_ids = [u.id for u in uploads]

    records = (
        SaleRecord.query.filter(SaleRecord.upload_id.in_(upload_ids)).all()
        if upload_ids else []
    )
    df = records_to_df(records)

    recent_uploads = [
        {
            "id": u.id,
            "filename": u.filename,
            "rows": u.rows,
            "status": u.status,
            "uploadedAt": u.uploaded_at.isoformat() if u.uploaded_at else None,
        }
        for u in uploads[:5]
    ]

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "plan": user.plan,
        },
        "organisation": {"id": organisation.id, "name": organisation.name} if organisation else None,
        "kpis": compute_kpis(df),
        "revenueTrend": monthly_trend(df),
        "topProducts": top_products(df),
        "categoryShare": category_share(df),
        "regionShare": region_share(df),
        "branchProfitability": branch_profitability(df),
        "recentUploads": recent_uploads,
    }, 200