"""
Tenant routes for Akiba Estate
Handles tenant dashboard, payments, notices, and maintenance requests
"""
from flask import Blueprint, request, jsonify
from models import db, House, Payment, Notice, Event, Warning, Photo, MaintenanceRequest, Message
from utils.roles import require_role, get_current_user
from datetime import datetime

tenant_bp = Blueprint("tenant", __name__)

@tenant_bp.route("/dashboard", methods=["GET"])
@require_role("tenant")
def dashboard():
    """
    Get tenant dashboard data
    Returns house info, payments, notices, events, warnings
    """
    try:
        user = get_current_user(request)
        
        # Get user's house
        house = House.query.get(user["house_id"]) if user.get("house_id") else None
        
        if not house:
            return jsonify({"error": "No house assigned to this tenant"}), 404
        
        # Get payments for this house
        payments = Payment.query.filter_by(house_id=house.id).all()
        
        # Get notices (general + house-specific)
        notices = Notice.query.filter(
            (Notice.house_id == house.id) | (Notice.house_id == None)
        ).order_by(Notice.created_at.desc()).all()
        
        # Get events
        events = Event.query.filter(
            (Event.house_id == house.id) | (Event.house_id == None)
        ).order_by(Event.event_date.asc()).all()
        
        # Get warnings for this house
        warnings = Warning.query.filter_by(house_id=house.id).order_by(Warning.created_at.desc()).all()
        
        # Get photos
        photos = Photo.query.filter(
            (Photo.house_id == house.id) | (Photo.photo_type == "landing")
        ).all()
        
        # Get maintenance requests
        maintenance = MaintenanceRequest.query.filter_by(house_id=house.id).all()
        
        return jsonify({
            "house": house.to_dict(),
            "payments": [p.to_dict() for p in payments],
            "notices": [n.to_dict() for n in notices],
            "events": [e.to_dict() for e in events],
            "warnings": [w.to_dict() for w in warnings],
            "photos": [p.to_dict() for p in photos],
            "maintenance_requests": [m.to_dict() for m in maintenance]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/payments", methods=["GET"])
@require_role("tenant")
def get_payments():
    """Get all payments for tenant's house"""
    try:
        user = get_current_user(request)
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        payments = Payment.query.filter_by(house_id=user["house_id"]).all()
        
        return jsonify([p.to_dict() for p in payments]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/notices", methods=["GET"])
@require_role("tenant")
def get_notices():
    """Get notices for tenant's house"""
    try:
        user = get_current_user(request)
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        notices = Notice.query.filter(
            (Notice.house_id == user["house_id"]) | (Notice.house_id == None)
        ).order_by(Notice.created_at.desc()).all()
        
        return jsonify([n.to_dict() for n in notices]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/events", methods=["GET"])
@require_role("tenant")
def get_events():
    """Get events for tenant's house"""
    try:
        user = get_current_user(request)
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        events = Event.query.filter(
            (Event.house_id == user["house_id"]) | (Event.house_id == None)
        ).order_by(Event.event_date.asc()).all()
        
        return jsonify([e.to_dict() for e in events]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/maintenance-requests", methods=["GET"])
@require_role("tenant")
def get_maintenance_requests():
    """Get tenant's maintenance requests"""
    try:
        user = get_current_user(request)
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        requests = MaintenanceRequest.query.filter_by(
            house_id=user["house_id"]
        ).all()
        
        return jsonify([r.to_dict() for r in requests]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/maintenance-requests", methods=["POST"])
@require_role("tenant")
def create_maintenance_request():
    """Create a new maintenance request"""
    try:
        user = get_current_user(request)
        data = request.json
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        required_fields = ["title", "description"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        maintenance_request = MaintenanceRequest(
            house_id=user["house_id"],
            user_id=user["id"],
            title=data["title"],
            description=data["description"],
            priority=data.get("priority", "normal")
        )
        
        db.session.add(maintenance_request)
        db.session.commit()
        
        return jsonify({
            "message": "Maintenance request created successfully",
            "request": maintenance_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/house", methods=["GET"])
@require_role("tenant")
def get_house_info():
    """Get detailed house information"""
    try:
        user = get_current_user(request)
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        house = House.query.get(user["house_id"])
        
        if not house:
            return jsonify({"error": "House not found"}), 404
        
        return jsonify(house.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/warnings", methods=["GET"])
@require_role("tenant")
def get_warnings():
    """Get warnings for tenant's house"""
    try:
        user = get_current_user(request)
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        warnings = Warning.query.filter_by(
            house_id=user["house_id"]
        ).order_by(Warning.created_at.desc()).all()
        
        return jsonify([w.to_dict() for w in warnings]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tenant_bp.route("/photos", methods=["GET"])
@require_role("tenant")
def get_photos():
    """Get photos for tenant's house"""
    try:
        user = get_current_user(request)
        
        if not user.get("house_id"):
            return jsonify({"error": "No house assigned"}), 404
        
        photos = Photo.query.filter(
            (Photo.house_id == user["house_id"]) | (Photo.photo_type == "landing")
        ).all()
        
        return jsonify([p.to_dict() for p in photos]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
