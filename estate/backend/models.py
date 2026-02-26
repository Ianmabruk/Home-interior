"""
Database models for Akiba Estate application
Defines all tables: Users, Houses, Payments, Notices, Messages, MaintenanceRequests, OTP, Events
"""
from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class User(db.Model):
    """User model - supports both Admin and Tenant roles"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Hashed password
    role = db.Column(db.String(20), nullable=False)  # 'admin' or 'tenant'
    house_id = db.Column(db.Integer, db.ForeignKey('houses.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    house = db.relationship('House', backref='tenants', foreign_keys=[house_id])
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'house_id': self.house_id
        }

class House(db.Model):
    """House model - represents properties in the estate"""
    __tablename__ = 'houses'
    
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(20), unique=True, nullable=False)
    owner = db.Column(db.String(100))
    residents = db.Column(db.JSON, default=[])  # List of resident names
    status = db.Column(db.String(20), default='occupied')  # occupied, vacant
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        """Convert house object to dictionary"""
        return {
            'id': self.id,
            'number': self.number,
            'owner': self.owner,
            'residents': self.residents,
            'status': self.status
        }

class Payment(db.Model):
    """Payment model - tracks rent and other payments"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    paid = db.Column(db.Boolean, default=False)
    paid_date = db.Column(db.Date, nullable=True)
    house_id = db.Column(db.Integer, db.ForeignKey('houses.id'), nullable=False)
    description = db.Column(db.String(200), default='Rent payment')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    house = db.relationship('House', backref='payments')
    
    def to_dict(self):
        """Convert payment object to dictionary"""
        return {
            'id': self.id,
            'amount': self.amount,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid': self.paid,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'house_id': self.house_id,
            'description': self.description
        }

class Notice(db.Model):
    """Notice model - admin announcements to all or specific houses"""
    __tablename__ = 'notices'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    house_id = db.Column(db.Integer, db.ForeignKey('houses.id'), nullable=True)  # Null = general notice
    priority = db.Column(db.String(20), default='normal')  # low, normal, high
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    house = db.relationship('House', backref='notices')
    
    def to_dict(self):
        """Convert notice object to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'house_id': self.house_id,
            'priority': self.priority,
            'created_at': self.created_at.isoformat()
        }

class Message(db.Model):
    """Message model - chat between admin and tenants"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Null = broadcast
    text = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id])
    receiver = db.relationship('User', foreign_keys=[receiver_id])
    
    def to_dict(self):
        """Convert message object to dictionary"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'text': self.text,
            'read': self.read,
            'time': self.time.isoformat()
        }

class MaintenanceRequest(db.Model):
    """Maintenance request model - tenants report issues"""
    __tablename__ = 'maintenance_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    house_id = db.Column(db.Integer, db.ForeignKey('houses.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, resolved
    priority = db.Column(db.String(20), default='normal')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    house = db.relationship('House', backref='maintenance_requests')
    user = db.relationship('User', backref='maintenance_requests')
    
    def to_dict(self):
        """Convert maintenance request to dictionary"""
        return {
            'id': self.id,
            'house_id': self.house_id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class OTP(db.Model):
    """OTP model - one-time passwords for password reset"""
    __tablename__ = 'otps'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    
    def is_valid(self):
        """Check if OTP is still valid"""
        return not self.used and datetime.datetime.utcnow() < self.expires_at

class Event(db.Model):
    """Event model - estate events and reminders"""
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    event_date = db.Column(db.DateTime, nullable=False)
    house_id = db.Column(db.Integer, db.ForeignKey('houses.id'), nullable=True)  # Null = all houses
    reminder_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    house = db.relationship('House', backref='events')
    
    def to_dict(self):
        """Convert event object to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'event_date': self.event_date.isoformat(),
            'house_id': self.house_id,
            'created_at': self.created_at.isoformat()
        }

class Warning(db.Model):
    """Warning model - admin warnings to tenants"""
    __tablename__ = 'warnings'
    
    id = db.Column(db.Integer, primary_key=True)
    house_id = db.Column(db.Integer, db.ForeignKey('houses.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='medium')  # low, medium, high
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    house = db.relationship('House', backref='warnings')
    
    def to_dict(self):
        """Convert warning object to dictionary"""
        return {
            'id': self.id,
            'house_id': self.house_id,
            'message': self.message,
            'severity': self.severity,
            'created_at': self.created_at.isoformat()
        }

class Photo(db.Model):
    """Photo model - house and estate photos"""
    __tablename__ = 'photos'
    
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(200))
    house_id = db.Column(db.Integer, db.ForeignKey('houses.id'), nullable=True)  # Null = landing page
    photo_type = db.Column(db.String(20), default='house')  # house, landing, event
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    house = db.relationship('House', backref='photos')
    
    def to_dict(self):
        """Convert photo object to dictionary"""
        return {
            'id': self.id,
            'url': self.url,
            'caption': self.caption,
            'house_id': self.house_id,
            'photo_type': self.photo_type,
            'uploaded_at': self.uploaded_at.isoformat()
        }
