
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
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

    app.config["JWT_SECRET_KEY"] = "your-secret-key"


    db.init_app(app)

    jwt = JWTManager(app)

    from app.models.user import User
    from app.models.organisation import Organisation

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp)

    with app.app_context():
        db.session.execute(text("SELECT 1"))
    print("MySQL connected successfully!")
    

    return app