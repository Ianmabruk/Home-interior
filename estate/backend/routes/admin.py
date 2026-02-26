"""
Admin routes for Akiba Estate
Handles house management, tenant management, notices, and admin operations
"""
from flask import Blueprint, request, jsonify
from models import db, House, User, Payment, Notice, Event, Warning, Photo, MaintenanceRequest
from utils.roles import require_role, get_current_user
from datetime import datetime, date

admin_bp = Blueprint("admin", __name__)

# ========== HOUSE MANAGEMENT ==========

@admin_bp.route("/houses", methods=["GET"])
@require_role("admin")
def get_houses():
    """Get all houses"""
    houses = House.query.all()
    return jsonify([house.to_dict() for house in houses]), 200

@admin_bp.route("/houses", methods=["POST"])
@require_role("admin")
def create_house():
    """Create a new house"""
    try:
        data = request.json
        
        if "number" not in data:
            return jsonify({"error": "House number required"}), 400
        
        # Check if house already exists
        existing = House.query.filter_by(number=data["number"]).first()
        if existing:
            return jsonify({"error": "House number already exists"}), 400
        
        house = House(
            number=data["number"],
            owner=data.get("owner", ""),
            residents=data.get("residents", []),
            status=data.get("status", "vacant")
        )
        
        db.session.add(house)
        db.session.commit()
        
        return jsonify({
            "message": "House created successfully",
            "house": house.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/houses/<int:house_id>", methods=["PUT"])
@require_role("admin")
def update_house(house_id):
    """Update house details"""
    try:
        house = House.query.get(house_id)
        if not house:
            return jsonify({"error": "House not found"}), 404
        
        data = request.json
        
        if "number" in data:
            house.number = data["number"]
        if "owner" in data:
            house.owner = data["owner"]
        if "residents" in data:
            house.residents = data["residents"]
        if "status" in data:
            house.status = data["status"]
        
        db.session.commit()
        
        return jsonify({
            "message": "House updated successfully",
            "house": house.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/houses/<int:house_id>", methods=["DELETE"])
@require_role("admin")
def delete_house(house_id):
    """Delete a house"""
    try:
        house = House.query.get(house_id)
        if not house:
            return jsonify({"error": "House not found"}), 404
        
        db.session.delete(house)
        db.session.commit()
        
        return jsonify({"message": "House deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== TENANT MANAGEMENT ==========

@admin_bp.route("/tenants", methods=["GET"])
@require_role("admin")
def get_tenants():
    """Get all tenants"""
    tenants = User.query.filter_by(role="tenant").all()
    return jsonify([user.to_dict() for user in tenants]), 200

@admin_bp.route("/tenants/<int:tenant_id>", methods=["PUT"])
@require_role("admin")
def update_tenant(tenant_id):
    """Update tenant details"""
    try:
        tenant = User.query.get(tenant_id)
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
        
        data = request.json
        
        if "house_id" in data:
            tenant.house_id = data["house_id"]
        if "email" in data:
            tenant.email = data["email"]
        if "phone" in data:
            tenant.phone = data["phone"]
        
        db.session.commit()
        
        return jsonify({
            "message": "Tenant updated successfully",
            "tenant": tenant.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/tenants/<int:tenant_id>", methods=["DELETE"])
@require_role("admin")
def delete_tenant(tenant_id):
    """Delete a tenant"""
    try:
        tenant = User.query.get(tenant_id)
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
        
        db.session.delete(tenant)
        db.session.commit()
        
        return jsonify({"message": "Tenant deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== NOTICES ==========

@admin_bp.route("/notices", methods=["GET"])
@require_role("admin")
def get_notices():
    """Get all notices"""
    notices = Notice.query.all()
    return jsonify([notice.to_dict() for notice in notices]), 200

@admin_bp.route("/notices", methods=["POST"])
@require_role("admin")
def send_notice():
    """Send a notice (general or house-specific)"""
    try:
        data = request.json
        user = get_current_user(request)
        
        if "message" not in data or "title" not in data:
            return jsonify({"error": "Title and message required"}), 400
        
        notice = Notice(
            title=data["title"],
            message=data["message"],
            house_id=data.get("house_id"),  # None = general notice
            priority=data.get("priority", "normal"),
            created_by=user["id"]
        )
        
        db.session.add(notice)
        db.session.commit()
        
        return jsonify({
            "message": "Notice sent successfully",
            "notice": notice.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== PAYMENTS ==========

@admin_bp.route("/payments", methods=["GET"])
@require_role("admin")
def get_all_payments():
    """Get all payments"""
    payments = Payment.query.all()
    return jsonify([payment.to_dict() for payment in payments]), 200

@admin_bp.route("/payments", methods=["POST"])
@require_role("admin")
def create_payment():
    """Create a payment record for a house"""
    try:
        data = request.json
        
        required_fields = ["amount", "due_date", "house_id"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        payment = Payment(
            amount=data["amount"],
            due_date=datetime.strptime(data["due_date"], "%Y-%m-%d").date(),
            house_id=data["house_id"],
            description=data.get("description", "Rent payment")
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            "message": "Payment created successfully",
            "payment": payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== EVENTS ==========

@admin_bp.route("/events", methods=["GET"])
@require_role("admin")
def get_events():
    """Get all events"""
    events = Event.query.all()
    return jsonify([event.to_dict() for event in events]), 200

@admin_bp.route("/events", methods=["POST"])
@require_role("admin")
def create_event():
    """Create an event"""
    try:
        data = request.json
        user = get_current_user(request)
        
        required_fields = ["title", "event_date"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        event = Event(
            title=data["title"],
            description=data.get("description", ""),
            event_date=datetime.strptime(data["event_date"], "%Y-%m-%d %H:%M:%S"),
            house_id=data.get("house_id"),
            created_by=user["id"]
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            "message": "Event created successfully",
            "event": event.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== WARNINGS ==========

@admin_bp.route("/warnings", methods=["POST"])
@require_role("admin")
def send_warning():
    """Send a warning to a house"""
    try:
        data = request.json
        user = get_current_user(request)
        
        required_fields = ["message", "house_id"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        warning = Warning(
            house_id=data["house_id"],
            message=data["message"],
            severity=data.get("severity", "medium"),
            created_by=user["id"]
        )
        
        db.session.add(warning)
        db.session.commit()
        
        return jsonify({
            "message": "Warning sent successfully",
            "warning": warning.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== PHOTOS ==========

@admin_bp.route("/photos", methods=["POST"])
@require_role("admin")
def upload_photo():
    """Upload a photo (landing page or house-specific)"""
    try:
        data = request.json
        user = get_current_user(request)
        
        if "url" not in data:
            return jsonify({"error": "Photo URL required"}), 400
        
        photo = Photo(
            url=data["url"],
            caption=data.get("caption", ""),
            house_id=data.get("house_id"),
            photo_type=data.get("photo_type", "house"),
            uploaded_by=user["id"]
        )
        
        db.session.add(photo)
        db.session.commit()
        
        return jsonify({
            "message": "Photo uploaded successfully",
            "photo": photo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/upload-image", methods=["POST"])
@require_role("admin")
def upload_landing_image():
    """Upload image for public landing/hero/gallery sections"""
    try:
        data = request.json
        user = get_current_user(request)

        if not data or "url" not in data or not str(data["url"]).strip():
            return jsonify({"error": "Image URL required"}), 400

        photo = Photo(
            url=str(data["url"]).strip(),
            caption=str(data.get("caption", "")).strip(),
            house_id=None,
            photo_type="landing",
            uploaded_by=user["id"]
        )

        db.session.add(photo)
        db.session.commit()

        return jsonify({
            "message": "Image uploaded successfully",
            "image": photo.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== MAINTENANCE REQUESTS ==========

@admin_bp.route("/maintenance-requests", methods=["GET"])
@require_role("admin")
def get_maintenance_requests():
    """Get all maintenance requests"""
    requests = MaintenanceRequest.query.all()
    return jsonify([req.to_dict() for req in requests]), 200

@admin_bp.route("/maintenance-requests/<int:request_id>", methods=["PUT"])
@require_role("admin")
def update_maintenance_request(request_id):
    """Update maintenance request status"""
    try:
        maint_request = MaintenanceRequest.query.get(request_id)
        if not maint_request:
            return jsonify({"error": "Request not found"}), 404
        
        data = request.json
        
        if "status" in data:
            maint_request.status = data["status"]
            if data["status"] == "resolved":
                maint_request.resolved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Request updated successfully",
            "request": maint_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== DASHBOARD STATS ==========

@admin_bp.route("/stats", methods=["GET"])
@require_role("admin")
def get_stats():
    """Get admin dashboard statistics"""
    try:
        total_houses = House.query.count()
        occupied_houses = House.query.filter_by(status="occupied").count()
        total_tenants = User.query.filter_by(role="tenant").count()
        pending_payments = Payment.query.filter_by(paid=False).count()
        pending_maintenance = MaintenanceRequest.query.filter_by(status="pending").count()
        
        return jsonify({
            "total_houses": total_houses,
            "occupied_houses": occupied_houses,
            "vacant_houses": total_houses - occupied_houses,
            "total_tenants": total_tenants,
            "pending_payments": pending_payments,
            "pending_maintenance": pending_maintenance
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
