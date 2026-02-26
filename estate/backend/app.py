"""
Main Flask application entry point for Akiba Estate
Initializes database, registers blueprints, and configures CORS
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
import os
import bcrypt
from config import Config
from models import db, User
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.tenant import tenant_bp
from routes.chat import chat_bp
from routes.public import public_bp

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for frontend communication
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Initialize database
db.init_app(app)
migrate = Migrate(app, db)

# Register blueprints (API routes)
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(tenant_bp, url_prefix="/api/tenant")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(public_bp, url_prefix="/api/public")

# Health check endpoint
@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "message": "Akiba Estate API is running"}), 200

# Root endpoint
@app.route("/", methods=["GET"])
def root():
    """Root endpoint with API information"""
    return jsonify({
        "name": "Akiba Estate API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "admin": "/api/admin",
            "tenant": "/api/tenant",
            "chat": "/api/chat"
        }
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({"error": "Internal server error"}), 500


def ensure_admin_user():
    """Ensure there is at least one admin account for dashboard access."""
    admin_exists = User.query.filter_by(role="admin").first()
    if admin_exists:
        return

    admin_like_user = User.query.filter(User.email.ilike("admin@%"), User.role == "tenant").first()
    if admin_like_user:
        admin_like_user.role = "admin"
        db.session.commit()
        print(f"✅ Promoted {admin_like_user.email} to admin role")
        return

    default_email = os.getenv("ADMIN_EMAIL", "admin@akiba.com")
    default_password = os.getenv("ADMIN_PASSWORD", "admin123")

    existing = User.query.filter_by(email=default_email).first()
    if existing:
        existing.role = "admin"
        db.session.commit()
        print(f"✅ Updated {default_email} role to admin")
        return

    hashed_password = bcrypt.hashpw(default_password.encode(), bcrypt.gensalt())
    admin_user = User(
        email=default_email,
        phone=os.getenv("ADMIN_PHONE", "+254700000000"),
        password=hashed_password,
        role="admin",
        house_id=None,
    )
    db.session.add(admin_user)
    db.session.commit()
    print(f"✅ Default admin created: {default_email}")

# Create tables on first run
with app.app_context():
    db.create_all()
    ensure_admin_user()
    print("✅ Database tables created successfully")

if __name__ == "__main__":
    print("🚀 Starting Akiba Estate API...")
    print("📍 Running on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
