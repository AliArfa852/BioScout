from datetime import datetime
from typing import List, Optional, Tuple

class Observation:
    """
    Observation model to store user observations of species in Islamabad
    """
    def __init__(
        self,
        user_id: str,
        species_name: str,
        common_names: List[str],
        location: Tuple[float, float],  # [longitude, latitude]
        image_url: str,
        type: str = None,  # 'plant', 'animal', 'fungi', 'other'
        description: Optional[str] = None,
        identification_confidence: float = 0.0,
        verified: bool = False,
        points_awarded: int = 0,
        created_at: datetime = None,
        updated_at: datetime = None,
        _id: str = None
    ):
        self._id = _id
        self.user_id = user_id
        self.species_name = species_name
        self.common_names = common_names
        self.location = {
            "type": "Point",
            "coordinates": location
        }
        self.image_url = image_url
        self.type = type
        self.description = description
        self.identification_confidence = identification_confidence
        self.verified = verified
        self.points_awarded = points_awarded
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    def to_dict(self):
        """Convert Observation object to dictionary for MongoDB storage"""
        return {
            "user_id": self.user_id,
            "species_name": self.species_name,
            "common_names": self.common_names,
            "location": self.location,
            "image_url": self.image_url,
            "type": self.type,
            "description": self.description,
            "identification_confidence": self.identification_confidence,
            "verified": self.verified,
            "points_awarded": self.points_awarded,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create Observation object from MongoDB document"""
        # Handle _id explicitly since it might be ObjectId
        _id = str(data.get("_id", "")) if data.get("_id") else None
        
        # Extract location
        location = data.get("location", {}).get("coordinates", [0, 0])
        
        return cls(
            _id=_id,
            user_id=data.get("user_id"),
            species_name=data.get("species_name"),
            common_names=data.get("common_names", []),
            location=location,
            image_url=data.get("image_url"),
            type=data.get("type"),
            description=data.get("description"),
            identification_confidence=data.get("identification_confidence", 0.0),
            verified=data.get("verified", False),
            points_awarded=data.get("points_awarded", 0),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )