"""
MongoDB Database Schema for BioScout Islamabad

This module defines the database schema for collections and their relationships.
"""
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
import datetime
from typing import Dict, List, Any, Optional, Union

# Collection names
USERS = 'users'
SPECIES = 'species'
OBSERVATIONS = 'observations'
LOCATIONS = 'locations'
RAG_DOCUMENTS = 'rag_documents'
QUERIES = 'queries'
AUDIT_LOGS = 'audit_logs'
BADGES = 'badges'
USER_BADGES = 'user_badges'

class DatabaseSchema:
    """
    Defines the database schema structure and relationships
    """
    
    @staticmethod
    def create_indexes(db):
        """Create necessary indexes for all collections"""
        
        # Users collection
        db[USERS].create_index('username', unique=True)
        db[USERS].create_index('email', unique=True)
        
        # Species collection
        db[SPECIES].create_index('scientific_name', unique=True)
        db[SPECIES].create_index('common_names')
        db[SPECIES].create_index('type')
        
        # Observations collection
        db[OBSERVATIONS].create_index('observation_id', unique=True)
        db[OBSERVATIONS].create_index('user_id')
        db[OBSERVATIONS].create_index('species_id')
        db[OBSERVATIONS].create_index('location_id')
        db[OBSERVATIONS].create_index('date_observed')
        db[OBSERVATIONS].create_index([('location.coordinates', '2dsphere')])
        
        # Locations collection
        db[LOCATIONS].create_index('name')
        db[LOCATIONS].create_index([('coordinates', '2dsphere')])
        
        # RAG documents collection
        db[RAG_DOCUMENTS].create_index('metadata.observation_id')
        db[RAG_DOCUMENTS].create_index('metadata.species_name')
        
        # Queries collection
        db[QUERIES].create_index('user_id')
        db[QUERIES].create_index('timestamp')
        
        # Audit logs collection 
        db[AUDIT_LOGS].create_index('timestamp')
        db[AUDIT_LOGS].create_index('user_id')
        db[AUDIT_LOGS].create_index('action')
        
        # Badges collection
        db[BADGES].create_index('name', unique=True)
        
        # User badges collection
        db[USER_BADGES].create_index([('user_id', 1), ('badge_id', 1)], unique=True)
    
    @staticmethod
    def get_schema_definitions():
        """
        Return schema definitions for all collections
        """
        return {
            USERS: {
                'description': 'Stores user account information',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'username': 'String - Unique username',
                    'email': 'String - Unique email address',
                    'password': 'String - Hashed password',
                    'first_name': 'String (optional)',
                    'last_name': 'String (optional)',
                    'profile_image_url': 'String - URL to profile image',
                    'bio': 'String - User biography (optional)',
                    'role': 'String - user/admin',
                    'points': 'Integer - Accumulated points',
                    'created_at': 'DateTime - Account creation time',
                    'updated_at': 'DateTime - Account last update time',
                    'last_login': 'DateTime - Last login time (optional)'
                }
            },
            
            SPECIES: {
                'description': 'Stores species information',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'scientific_name': 'String - Unique scientific name',
                    'common_names': 'Array of Strings - Common names',
                    'type': 'String - plant/animal/fungi/other',
                    'description': 'String - Species description',
                    'habitat': 'String - Habitat description',
                    'image_urls': 'Array of Strings - URLs to species images',
                    'is_endemic': 'Boolean - Whether species is endemic to region',
                    'seasonal_presence': 'Array of Strings - Seasons when present',
                    'conservation_status': 'String - Conservation status (optional)',
                    'dietary_habits': 'String - Diet information (optional)',
                    'created_at': 'DateTime - Creation time',
                    'updated_at': 'DateTime - Last update time'
                }
            },
            
            LOCATIONS: {
                'description': 'Stores location information for observations',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'name': 'String - Location name',
                    'description': 'String - Location description',
                    'coordinates': 'Object - GeoJSON Point with longitude and latitude',
                    'area_type': 'String - urban/forest/lake/mountain/etc.',
                    'created_at': 'DateTime - Creation time'
                }
            },
            
            OBSERVATIONS: {
                'description': 'Stores biodiversity observations',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'observation_id': 'String - Unique formatted ID (OBS0001)',
                    'user_id': 'ObjectId - Reference to users collection',
                    'species_id': 'ObjectId - Reference to species collection',
                    'location_id': 'ObjectId - Reference to locations collection (optional)',
                    'location_text': 'String - Human-readable location description',
                    'location': 'Object - GeoJSON Point with longitude and latitude',
                    'date_observed': 'DateTime - When species was observed',
                    'image_url': 'String - URL to observation image',
                    'notes': 'String - Additional observation notes',
                    'identification_confidence': 'Float - Confidence level (0-1)',
                    'verified': 'Boolean - Whether observation is verified',
                    'points_awarded': 'Integer - Points awarded for this observation',
                    'created_at': 'DateTime - Creation time',
                    'updated_at': 'DateTime - Last update time'
                }
            },
            
            RAG_DOCUMENTS: {
                'description': 'Stores documents for RAG system',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'title': 'String - Document title',
                    'content': 'String - Document content',
                    'embedding': 'Array of Floats - Vector embedding',
                    'metadata': 'Object - Additional metadata',
                    'created_at': 'DateTime - Creation time',
                    'updated_at': 'DateTime - Last update time'
                }
            },
            
            QUERIES: {
                'description': 'Stores user queries for RAG system',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'user_id': 'ObjectId - Reference to users collection (optional)',
                    'question': 'String - User question',
                    'answer': 'String - Generated answer',
                    'sources_used': 'Array of Strings - Sources used in answer',
                    'related_observation_ids': 'Array of ObjectIds - Related observations',
                    'related_species_ids': 'Array of ObjectIds - Related species',
                    'timestamp': 'DateTime - Query time'
                }
            },
            
            AUDIT_LOGS: {
                'description': 'Stores audit logs for user actions',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'user_id': 'ObjectId - Reference to users collection',
                    'action': 'String - Action performed',
                    'entity_type': 'String - Type of entity affected',
                    'entity_id': 'ObjectId - ID of entity affected',
                    'details': 'Object - Additional action details',
                    'timestamp': 'DateTime - Action time',
                    'ip_address': 'String - User IP address (optional)'
                }
            },
            
            BADGES: {
                'description': 'Stores achievement badges',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'name': 'String - Badge name',
                    'description': 'String - Badge description',
                    'icon': 'String - Badge icon URL or name',
                    'points': 'Integer - Points awarded for badge',
                    'requirements': 'Object - Requirements to earn badge',
                    'created_at': 'DateTime - Creation time'
                }
            },
            
            USER_BADGES: {
                'description': 'Stores badge assignments to users',
                'fields': {
                    '_id': 'ObjectId - Primary key',
                    'user_id': 'ObjectId - Reference to users collection',
                    'badge_id': 'ObjectId - Reference to badges collection',
                    'awarded_at': 'DateTime - When badge was awarded',
                    'details': 'Object - Additional details about award'
                }
            }
        }
    
    @staticmethod
    def create_user_document(username: str, email: str, password: str, 
                             first_name: Optional[str] = None, 
                             last_name: Optional[str] = None, 
                             profile_image_url: Optional[str] = None) -> Dict[str, Any]:
        """Create a new user document"""
        now = datetime.datetime.now()
        return {
            'username': username,
            'email': email,
            'password': password,  # Should be hashed by the caller
            'first_name': first_name,
            'last_name': last_name,
            'profile_image_url': profile_image_url,
            'bio': '',
            'role': 'user',
            'points': 0,
            'created_at': now,
            'updated_at': now
        }
    
    @staticmethod
    def create_species_document(scientific_name: str, common_names: List[str], 
                                species_type: str, description: str, habitat: str, 
                                image_urls: List[str], is_endemic: bool,
                                seasonal_presence: List[str],
                                conservation_status: Optional[str] = None,
                                dietary_habits: Optional[str] = None) -> Dict[str, Any]:
        """Create a new species document"""
        now = datetime.datetime.now()
        return {
            'scientific_name': scientific_name,
            'common_names': common_names,
            'type': species_type,
            'description': description,
            'habitat': habitat,
            'image_urls': image_urls,
            'is_endemic': is_endemic,
            'seasonal_presence': seasonal_presence,
            'conservation_status': conservation_status,
            'dietary_habits': dietary_habits,
            'created_at': now,
            'updated_at': now
        }
    
    @staticmethod
    def create_location_document(name: str, description: str, 
                                 longitude: float, latitude: float,
                                 area_type: str) -> Dict[str, Any]:
        """Create a new location document"""
        return {
            'name': name,
            'description': description,
            'coordinates': {
                'type': 'Point',
                'coordinates': [longitude, latitude]  # GeoJSON format is [longitude, latitude]
            },
            'area_type': area_type,
            'created_at': datetime.datetime.now()
        }
    
    @staticmethod
    def create_observation_document(observation_id: str, user_id: Union[str, ObjectId],
                                   species_id: Union[str, ObjectId], 
                                   location_text: str, longitude: float, latitude: float,
                                   date_observed: datetime.datetime, image_url: str,
                                   notes: str, identification_confidence: float = 0.7,
                                   verified: bool = False, points_awarded: int = 10,
                                   location_id: Optional[Union[str, ObjectId]] = None) -> Dict[str, Any]:
        """Create a new observation document"""
        now = datetime.datetime.now()
        
        # Convert string IDs to ObjectId
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        if isinstance(species_id, str):
            species_id = ObjectId(species_id)
        if location_id and isinstance(location_id, str):
            location_id = ObjectId(location_id)
            
        return {
            'observation_id': observation_id,
            'user_id': user_id,
            'species_id': species_id,
            'location_id': location_id,
            'location_text': location_text,
            'location': {
                'type': 'Point',
                'coordinates': [longitude, latitude]  # GeoJSON format is [longitude, latitude]
            },
            'date_observed': date_observed,
            'image_url': image_url,
            'notes': notes,
            'identification_confidence': identification_confidence,
            'verified': verified,
            'points_awarded': points_awarded,
            'created_at': now,
            'updated_at': now
        }
    
    @staticmethod
    def create_rag_document(title: str, content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new RAG document"""
        now = datetime.datetime.now()
        return {
            'title': title,
            'content': content,
            'embedding': None,  # Will be computed by RAG system
            'metadata': metadata,
            'created_at': now,
            'updated_at': now
        }
    
    @staticmethod
    def create_query_document(question: str, answer: str, 
                             sources_used: List[str],
                             user_id: Optional[Union[str, ObjectId]] = None,
                             related_observation_ids: Optional[List[Union[str, ObjectId]]] = None,
                             related_species_ids: Optional[List[Union[str, ObjectId]]] = None) -> Dict[str, Any]:
        """Create a new query document"""
        
        # Convert string IDs to ObjectId
        if user_id and isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        if related_observation_ids:
            related_observation_ids = [
                ObjectId(id) if isinstance(id, str) else id 
                for id in related_observation_ids
            ]
            
        if related_species_ids:
            related_species_ids = [
                ObjectId(id) if isinstance(id, str) else id 
                for id in related_species_ids
            ]
            
        return {
            'user_id': user_id,
            'question': question,
            'answer': answer,
            'sources_used': sources_used,
            'related_observation_ids': related_observation_ids or [],
            'related_species_ids': related_species_ids or [],
            'timestamp': datetime.datetime.now()
        }
    
    @staticmethod
    def create_audit_log_document(user_id: Union[str, ObjectId], 
                                 action: str, entity_type: str,
                                 entity_id: Union[str, ObjectId],
                                 details: Dict[str, Any] = None,
                                 ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Create a new audit log document"""
        
        # Convert string IDs to ObjectId
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        if isinstance(entity_id, str):
            entity_id = ObjectId(entity_id)
            
        return {
            'user_id': user_id,
            'action': action,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'details': details or {},
            'timestamp': datetime.datetime.now(),
            'ip_address': ip_address
        }
        
    @staticmethod
    def create_badge_document(name: str, description: str, 
                             icon: str, points: int,
                             requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new badge document"""
        return {
            'name': name,
            'description': description,
            'icon': icon,
            'points': points,
            'requirements': requirements,
            'created_at': datetime.datetime.now()
        }
        
    @staticmethod
    def create_user_badge_document(user_id: Union[str, ObjectId],
                                  badge_id: Union[str, ObjectId],
                                  details: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a new user badge document"""
        
        # Convert string IDs to ObjectId
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        if isinstance(badge_id, str):
            badge_id = ObjectId(badge_id)
            
        return {
            'user_id': user_id,
            'badge_id': badge_id,
            'awarded_at': datetime.datetime.now(),
            'details': details or {}
        }