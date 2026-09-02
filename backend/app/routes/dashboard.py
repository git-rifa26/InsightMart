from flask import Blueprint, request
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
        compute_kpis, monthly_trend, top_products, category_share,
        region_share, records_to_df, filter_by_range, branch_profitability,
    )

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    organisation = Organisation.query.get(user.organisation_id) if user.organisation_id else None
    query = Upload.query.filter_by(status="processed")
    if user.organisation_id:
        query = query.filter_by(organisation_id=user.organisation_id)
    else:
        query = query.filter_by(uploaded_by=user.id)

    uploads = query.order_by(Upload.uploaded_at.desc()).all()
    upload_ids = [upload.id for upload in uploads]
    records = (
        SaleRecord.query.filter(SaleRecord.upload_id.in_(upload_ids)).all()
        if upload_ids else []
    )
    date_range = request.args.get("range", "12m")
    df = filter_by_range(records_to_df(records), date_range)

    recent_uploads = []
    for upload in uploads[:5]:
        uploader = User.query.get(upload.uploaded_by)
        recent_uploads.append({
            "id": upload.id,
            "filename": upload.filename,
            "rows": upload.rows,
            "size": upload.size,
            "status": upload.status,
            "uploadedBy": uploader.name if uploader else "Unknown",
            "uploadedAt": upload.uploaded_at.isoformat() if upload.uploaded_at else None,
        })

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "plan": user.plan,
        },
        "organisation": {"id": organisation.id, "name": organisation.name} if organisation else None,
        "range": date_range,
        "kpis": compute_kpis(df),
        "revenueTrend": monthly_trend(df),
        "topProducts": top_products(df, 5),
        "categoryShare": category_share(df),
        "regionShare": region_share(df),
        "branchProfitability": branch_profitability(df),
        "recentUploads": recent_uploads,
    }, 200
