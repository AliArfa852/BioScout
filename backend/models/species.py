from datetime import datetime
from typing import List, Optional

class Species:
    """
    Species model to store information about plants, animals and fungi in Islamabad
    """
    def __init__(
        self,
        scientific_name: str,
        common_names: List[str],
        type: str,  # 'plant', 'animal', 'fungi', 'other'
        description: str,
        habitat: str,
        image_urls: List[str],
        is_endemic: bool = False,
        seasonal_presence: List[str] = None,
        conservation_status: Optional[str] = None,
        dietary_habits: Optional[str] = None,
        created_at: datetime = None,
        updated_at: datetime = None,
        _id: str = None
    ):
        self._id = _id
        self.scientific_name = scientific_name
        self.common_names = common_names
        self.type = type
        self.description = description
        self.habitat = habitat
        self.image_urls = image_urls
        self.is_endemic = is_endemic
        self.seasonal_presence = seasonal_presence or []
        self.conservation_status = conservation_status
        self.dietary_habits = dietary_habits
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    def to_dict(self):
        """Convert Species object to dictionary for MongoDB storage"""
        return {
            "scientific_name": self.scientific_name,
            "common_names": self.common_names,
            "type": self.type,
            "description": self.description,
            "habitat": self.habitat,
            "image_urls": self.image_urls,
            "is_endemic": self.is_endemic,
            "seasonal_presence": self.seasonal_presence,
            "conservation_status": self.conservation_status,
            "dietary_habits": self.dietary_habits,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create Species object from MongoDB document"""
        # Handle _id explicitly since it might be ObjectId
        _id = str(data.get("_id", "")) if data.get("_id") else None
        
        return cls(
            _id=_id,
            scientific_name=data.get("scientific_name"),
            common_names=data.get("common_names", []),
            type=data.get("type", "other"),
            description=data.get("description", ""),
            habitat=data.get("habitat", ""),
            image_urls=data.get("image_urls", []),
            is_endemic=data.get("is_endemic", False),
            seasonal_presence=data.get("seasonal_presence", []),
            conservation_status=data.get("conservation_status"),
            dietary_habits=data.get("dietary_habits"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )