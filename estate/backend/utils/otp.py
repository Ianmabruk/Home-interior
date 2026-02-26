"""
OTP utility functions for generating and validating one-time passwords
"""
import random
import string
from datetime import datetime, timedelta

def generate_otp(length=6):
    """
    Generate a random numeric OTP
    Default length is 6 digits
    """
    return ''.join(random.choices(string.digits, k=length))

def generate_alphanumeric_otp(length=8):
    """
    Generate a random alphanumeric OTP
    Default length is 8 characters
    """
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=length))

def get_otp_expiration(minutes=10):
    """
    Get expiration datetime for OTP
    Default is 10 minutes from now
    """
    return datetime.utcnow() + timedelta(minutes=minutes)

def is_otp_expired(expires_at):
    """
    Check if OTP has expired
    """
    return datetime.utcnow() > expires_at
