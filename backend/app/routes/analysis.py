import io
from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_csv():
    from app.models.user import User
    from app.models.upload import Upload
    from app.models.sale import SaleRecord
    from app.services.csv_service import clean_sales_csv, CsvValidationError
    from app import db

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    if user.uploads_this_month >= user.upload_limit:
        return {"message": f"You have reached your monthly upload limit of {user.upload_limit}."}, 403

    if "file" not in request.files:
        return {"message": "No file was sent."}, 400

    file = request.files["file"]
    if not file.filename.lower().endswith(".csv"):
        return {"message": "Only .csv files are supported."}, 400

    raw_bytes = file.read()

    try:
        df, report = clean_sales_csv(io.BytesIO(raw_bytes))
    except CsvValidationError as exc:
        failed = Upload(
            filename=file.filename, size=len(raw_bytes), rows=0, status="failed",
            error=str(exc), uploaded_by=user.id, organisation_id=user.organisation_id,
        )
        db.session.add(failed)
        db.session.commit()
        return {"message": str(exc)}, 422

    upload = Upload(
        filename=file.filename,
        size=len(raw_bytes),
        rows=report["rows_kept"],
        status="processed",
        has_cost_data=report["has_cost_data"],
        uploaded_by=user.id,
        organisation_id=user.organisation_id,
    )
    db.session.add(upload)
    db.session.flush()

    for _, row in df.iterrows():
        db.session.add(SaleRecord(
            upload_id=upload.id,
            date=row["date"].date(),
            product=row["product"],
            category=row.get("category", "Unknown"),
            branch=row.get("branch", "Unknown"),
            region=row.get("region", "Unknown"),
            customer_id=row.get("customer_id", "Unknown"),
            quantity=float(row.get("quantity", 1) or 1),
            revenue=float(row["revenue"]),
            cost=float(row["cost"]) if row.get("cost") == row.get("cost") else None,
            profit=float(row["profit"]) if row.get("profit") == row.get("profit") else None,
            year=int(row["year"]),
            month=row["month"],
            month_index=int(row["date"].month) - 1,
            quarter=row["quarter"],
        ))

    user.uploads_this_month += 1
    db.session.commit()

    return {
        "upload": {
            "id": upload.id,
            "filename": upload.filename,
            "size": upload.size,
            "rows": upload.rows,
            "status": upload.status,
        }
    }, 200


@analysis_bp.route("/uploads", methods=["GET"])
@jwt_required()
def list_uploads():
    from app.models.user import User
    from app.models.upload import Upload

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    query = Upload.query
    if user.organisation_id:
        query = query.filter_by(organisation_id=user.organisation_id)
    else:
        query = query.filter_by(uploaded_by=user.id)

    uploads = query.order_by(Upload.uploaded_at.desc()).all()

    return {
        "uploads": [
            {"id": u.id, "filename": u.filename, "rows": u.rows, "status": u.status}
            for u in uploads
        ]
    }, 200


@analysis_bp.route("/", methods=["GET"])
@jwt_required()
def get_analysis():
    from app.models.user import User
    from app.models.upload import Upload
    from app.models.sale import SaleRecord
    from app.services.analytics_service import full_analysis, records_to_df

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    upload_id = request.args.get("uploadId")

    if upload_id:
        upload = Upload.query.get(upload_id)
        if not upload:
            return {"message": "That upload no longer exists."}, 404
        allowed = upload.uploaded_by == user.id or (
            user.organisation_id and upload.organisation_id == user.organisation_id
        )
        if not allowed:
            return {"message": "You do not have access to that upload."}, 403
        records = SaleRecord.query.filter_by(upload_id=upload.id).all()
    else:
        query = Upload.query
        if user.organisation_id:
            query = query.filter_by(organisation_id=user.organisation_id)
        else:
            query = query.filter_by(uploaded_by=user.id)
        upload_ids = [u.id for u in query.all()]
        records = SaleRecord.query.filter(SaleRecord.upload_id.in_(upload_ids)).all() if upload_ids else []
        upload = query.order_by(Upload.uploaded_at.desc()).first()

    df = records_to_df(records)
    payload = full_analysis(df)
    payload["uploadId"] = upload.id if upload else None

    return payload, 200


@analysis_bp.route("/<int:upload_id>/report", methods=["GET"])
@jwt_required()
def export_report(upload_id):
    from app.models.user import User
    from app.models.upload import Upload
    from app.services.analytics_service import full_analysis, records_to_df
    from app.services.pdf_service import build_analysis_report

    user = User.query.get(get_jwt_identity())
    if not user:
        return {"message": "User not found"}, 404

    upload = Upload.query.get(upload_id)
    if not upload:
        return {"message": "That upload no longer exists."}, 404

    allowed = upload.uploaded_by == user.id or (
        user.organisation_id and upload.organisation_id == user.organisation_id
    )
    if not allowed:
        return {"message": "You do not have access to that upload."}, 403

    df = records_to_df(upload.records.all()) if hasattr(upload, "records") else records_to_df(
        __import__("app.models.sale", fromlist=["SaleRecord"]).SaleRecord.query.filter_by(upload_id=upload.id).all()
    )
    payload = full_analysis(df)
    pdf_bytes = build_analysis_report(upload, payload)

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="insightmart-analysis.pdf",
    )
