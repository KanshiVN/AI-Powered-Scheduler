from flask import Flask
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.hod_routes import hod_bp
from routes.faculty_routes import faculty_bp
from routes.exam_routes import exam_bp
from routes.common_routes import common_bp



def create_app():
    app = Flask(__name__)

    # Basic configuration
    app.config["SECRET_KEY"] = "dev-secret-key"
    app.config["DEBUG"] = True

    # Enable CORS (frontend → backend)
    CORS(app)
    app.register_blueprint(common_bp, url_prefix="/api/common")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(hod_bp, url_prefix="/api/hod")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
    app.register_blueprint(exam_bp, url_prefix="/api/exam")
    
    
    # Health check route
    @app.route("/api/health", methods=["GET"])
    def health():
        return {
            "status": "OK",
            "message": "Flask backend is running successfully"
        }

    return app


if __name__ == "__main__":
    app = create_app()
    
    app.run(host="0.0.0.0", port=5000)
