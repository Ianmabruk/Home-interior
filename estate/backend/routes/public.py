"""
Public routes for landing page assets and unauthenticated data.
"""
from flask import Blueprint, jsonify
from models import Photo

public_bp = Blueprint("public", __name__)


@public_bp.route("/images", methods=["GET"])
def get_public_images():
    """Return admin-managed landing/gallery images."""
    images = (
        Photo.query
        .filter(Photo.photo_type == "landing")
        .order_by(Photo.uploaded_at.desc())
        .all()
    )

    payload = [
        {
            "id": image.id,
            "url": image.url,
            "caption": image.caption or "Akiba Estate",
        }
        for image in images
    ]

    return jsonify(payload), 200
