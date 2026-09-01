
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import text
from sqlalchemy.engine import URL
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

db = SQLAlchemy()


def create_app():
    load_dotenv()

    app = Flask(__name__)

    database_url = URL.create(
        drivername="mysql+pymysql",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        database=os.getenv("DB_NAME")
    )

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")


    db.init_app(app)
    jwt = JWTManager(app)

    CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "http://localhost:5173")}})

    from app.models.user import User
    from app.models.organisation import Organisation
    from app.models.upload import Upload
    from app.models.sales import SaleRecord

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    
    from app.routes.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    from app.routes.account import account_bp
    app.register_blueprint(account_bp, url_prefix="/api/account")

    from app.routes.organisation import organisation_bp
    app.register_blueprint(organisation_bp, url_prefix="/api/organisation")

    from app.routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    from app.routes.analysis import analysis_bp
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")

    with app.app_context():
        db.session.execute(text("SELECT 1"))
    print("MySQL connected successfully!")
    

    return app