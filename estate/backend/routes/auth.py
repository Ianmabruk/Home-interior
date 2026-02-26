"""
Authentication routes for Akiba Estate
Handles login, signup, password reset with OTP
"""
from flask import Blueprint, request, jsonify
from models import db, User, OTP, House
import bcrypt
import random
import datetime
from utils.jwt import create_token

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Register a new user (tenant)
    Required fields: email, phone, password, and house_number (or house_id)
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ["email", "phone", "password"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        house_id = data.get("house_id")
        house_number = data.get("house_number")

        if not house_id and not house_number:
            return jsonify({"error": "house_number or house_id is required"}), 400

        house = None
        if house_number:
            normalized_house_number = str(house_number).strip().upper()
            house = House.query.filter(db.func.upper(House.number) == normalized_house_number).first()
            if not house:
                house = House(
                    number=normalized_house_number,
                    owner="",
                    residents=[],
                    status="occupied"
                )
                db.session.add(house)
                db.session.flush()
            house_id = house.id
        elif house_id:
            house = House.query.get(house_id)
            if not house:
                return jsonify({"error": "House not found"}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data["email"]).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400
        
        # Hash password
        hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())
        
        # Create new user
        user = User(
            email=data["email"],
            phone=data["phone"],
            password=hashed,
            role="tenant",
            house_id=house_id
        )
        
        db.session.add(user)
        db.session.commit()
        
        token = create_token(user)

        return jsonify({
            "message": "Account created successfully",
            "token": token,
            "role": user.role,
            "user": user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Login user with email and password
    Returns JWT token and user role
    """
    try:
        data = request.json
        
        # Validate required fields
        if "email" not in data or "password" not in data:
            return jsonify({"error": "Email and password required"}), 400
        
        # Find user
        user = User.query.filter_by(email=data["email"]).first()
        
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Verify password
        if not bcrypt.checkpw(data["password"].encode(), user.password):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate JWT token
        token = create_token(user)
        
        normalized_role = (user.role or "tenant").strip().lower()

        return jsonify({
            "token": token,
            "role": normalized_role,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    """
    Generate and send OTP for password reset
    In production, this should send email via SMTP
    """
    try:
        data = request.json
        
        if "email" not in data:
            return jsonify({"error": "Email required"}), 400
        
        email = data["email"]
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Email not found"}), 404
        
        # Generate 6-digit OTP
        code = str(random.randint(100000, 999999))
        
        # Create OTP with 10-minute expiration
        otp = OTP(
            email=email,
            code=code,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
        )
        
        db.session.add(otp)
        db.session.commit()
        
        # TODO: In production, send email here
        # send_email(email, f"Your OTP is: {code}")
        
        return jsonify({
            "message": "OTP sent successfully",
            "otp": code  # Remove this in production
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """
    Verify OTP code
    Required fields: email, code
    """
    try:
        data = request.json
        
        if "email" not in data or "code" not in data:
            return jsonify({"error": "Email and code required"}), 400
        
        # Find valid OTP
        otp = OTP.query.filter_by(
            email=data["email"],
            code=data["code"],
            used=False
        ).first()
        
        if not otp or not otp.is_valid():
            return jsonify({"error": "Invalid or expired OTP"}), 400
        
        # Mark OTP as used
        otp.used = True
        db.session.commit()
        
        return jsonify({"message": "OTP verified successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Reset password after OTP verification
    Required fields: email, code, new_password
    """
    try:
        data = request.json
        
        required_fields = ["email", "code", "new_password"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Verify OTP
        otp = OTP.query.filter_by(
            email=data["email"],
            code=data["code"],
            used=False
        ).first()
        
        if not otp or not otp.is_valid():
            return jsonify({"error": "Invalid or expired OTP"}), 400
        
        # Find user
        user = User.query.filter_by(email=data["email"]).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Hash new password
        hashed = bcrypt.hashpw(data["new_password"].encode(), bcrypt.gensalt())
        user.password = hashed
        
        # Mark OTP as used
        otp.used = True
        
        db.session.commit()
        
        return jsonify({"message": "Password reset successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
