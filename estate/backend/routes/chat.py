"""
Chat routes for Akiba Estate
Handles messaging between admin and tenants
"""
from flask import Blueprint, request, jsonify
from models import db, Message, User
from utils.roles import get_current_user, require_auth
from datetime import datetime

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/messages", methods=["GET"])
@require_auth
def get_messages():
    """
    Get messages for current user
    Returns both sent and received messages
    """
    try:
        user = get_current_user(request)
        
        # Get messages where user is sender or receiver
        sent_messages = Message.query.filter_by(sender_id=user["id"]).all()
        received_messages = Message.query.filter_by(receiver_id=user["id"]).all()
        
        # Get broadcast messages (receiver_id = None) if tenant
        broadcast_messages = []
        if user["role"] == "tenant":
            broadcast_messages = Message.query.filter_by(receiver_id=None).all()
        
        all_messages = sent_messages + received_messages + broadcast_messages
        
        # Sort by time
        all_messages.sort(key=lambda x: x.time, reverse=True)
        
        return jsonify([msg.to_dict() for msg in all_messages]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route("/messages/conversation/<int:other_user_id>", methods=["GET"])
@require_auth
def get_conversation(other_user_id):
    """
    Get conversation between current user and another user
    """
    try:
        user = get_current_user(request)
        
        # Get messages between the two users
        messages = Message.query.filter(
            ((Message.sender_id == user["id"]) & (Message.receiver_id == other_user_id)) |
            ((Message.sender_id == other_user_id) & (Message.receiver_id == user["id"]))
        ).order_by(Message.time.asc()).all()
        
        # Mark received messages as read
        for msg in messages:
            if msg.receiver_id == user["id"] and not msg.read:
                msg.read = True
        
        db.session.commit()
        
        return jsonify([msg.to_dict() for msg in messages]), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@chat_bp.route("/messages", methods=["POST"])
@require_auth
def send_message():
    """
    Send a message to another user or broadcast (admin only)
    Required fields: text
    Optional fields: receiver_id (None = broadcast)
    """
    try:
        user = get_current_user(request)
        data = request.json
        
        if "text" not in data:
            return jsonify({"error": "Message text required"}), 400
        
        receiver_id = data.get("receiver_id")
        
        # Only admin can broadcast
        if receiver_id is None and user["role"] != "admin":
            return jsonify({"error": "Only admin can broadcast messages"}), 403
        
        # Verify receiver exists if specified
        if receiver_id:
            receiver = User.query.get(receiver_id)
            if not receiver:
                return jsonify({"error": "Receiver not found"}), 404
        
        message = Message(
            sender_id=user["id"],
            receiver_id=receiver_id,
            text=data["text"]
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            "message": "Message sent successfully",
            "data": message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@chat_bp.route("/messages/<int:message_id>/read", methods=["PUT"])
@require_auth
def mark_as_read(message_id):
    """Mark a message as read"""
    try:
        user = get_current_user(request)
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Only receiver can mark as read
        if message.receiver_id != user["id"]:
            return jsonify({"error": "Unauthorized"}), 403
        
        message.read = True
        db.session.commit()
        
        return jsonify({"message": "Message marked as read"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@chat_bp.route("/users", methods=["GET"])
@require_auth
def get_users():
    """
    Get list of users for chat
    Tenants see only admin
    Admin sees all tenants
    """
    try:
        user = get_current_user(request)
        
        if user["role"] == "admin":
            # Admin sees all tenants
            users = User.query.filter_by(role="tenant").all()
        else:
            # Tenants see only admin
            users = User.query.filter_by(role="admin").all()
        
        return jsonify([{
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "house_id": u.house_id
        } for u in users]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route("/unread-count", methods=["GET"])
@require_auth
def get_unread_count():
    """Get count of unread messages for current user"""
    try:
        user = get_current_user(request)
        
        count = Message.query.filter_by(
            receiver_id=user["id"],
            read=False
        ).count()
        
        return jsonify({"unread_count": count}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
