import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import '../styles/wildlife-theme.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom marker icons for different species types
const customIcons = {
  plant: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNTA4NjVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDIwQTcgNyAwIDAgMSA0IDEzQzQgNiAxMiAzIDEyIDNzOCAzIDggMTBhNyA3IDAgMCAxLTcgN2gtMnoiLz48cGF0aCBkPSJNMTIgM3YxNyIvPjwvc3ZnPg==',
    iconSize: [30, 41],
    iconAnchor: [15, 41],
    popupAnchor: [0, -41],
  }),
  animal: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDg5YTYzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDE5YTQgNCAwIDAgMS00LTQgOCA4IDAgMCAxIDggMCA0IDQgMCAwIDEtNCA0eiIvPjxjaXJjbGUgY3g9IjciIGN5PSI1IiByPSIyIi8+PGNpcmNsZSBjeD0iMTciIGN5PSI1IiByPSIyIi8+PGNpcmNsZSBjeD0iNSIgY3k9IjEyIiByPSIyIi8+PGNpcmNsZSBjeD0iMTkiIGN5PSIxMiIgcj0iMiIvPjwvc3ZnPg==',
    iconSize: [30, 41],
    iconAnchor: [15, 41],
    popupAnchor: [0, -41],
  }),
  fungi: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWI2ZDU2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTcgMTBoMTB2NEg3eiIvPjxwYXRoIGQ9Ik0xMSAyQzcgMiAzIDMgMyA4aDE4YzAtNS00LTYtOC02eiIvPjxwYXRoIGQ9Ik0xMiAxNnY2Ii8+PHBhdGggZD0iTTggMTZ2MiIvPjxwYXRoIGQ9Ik0xNiAxNnYyIi8+PC9zdmc+',
    iconSize: [30, 41],
    iconAnchor: [15, 41],
    popupAnchor: [0, -41],
  }),
  other: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNmQ4OGNkIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0xMiA4djQiPjwvcGF0aD48cGF0aCBkPSJNMTIgMTZoLjAxIj48L3BhdGg+PC9zdmc+',
    iconSize: [30, 41],
    iconAnchor: [15, 41],
    popupAnchor: [0, -41],
  })
};

// Initial center of Islamabad
const ISLAMABAD_CENTER = [33.6844, 73.0479];

// Component to recenter map
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

// Cluster marker component for showing multiple markers in an area
function ClusterMarker({ count, position, onClick }: { count: number; position: [number, number]; onClick: () => void }) {
  return (
    <Marker 
      position={position} 
      icon={L.divIcon({
        html: `<div class="cluster-marker">${count}</div>`,
        className: 'cluster-marker-container',
        iconSize: L.point(40, 40)
      })}
      eventHandlers={{ click: onClick }}
    />
  );
}

export default function MapPage() {
  const { user } = useAuth();
  const [center, setCenter] = useState<[number, number]>(ISLAMABAD_CENTER);
  const [filters, setFilters] = useState({
    type: '',
    species: '',
    verified: '',
    user_id: ''
  });
  const mapRef = useRef<L.Map | null>(null);
  
  // Fetch all observations
  const { data: observations, isLoading } = useQuery({
    queryKey: ['/api/observations', filters],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.species) queryParams.append('species_name', filters.species);
      if (filters.verified) queryParams.append('verified', filters.verified);
      if (filters.user_id) queryParams.append('user_id', filters.user_id);
      
      const queryString = queryParams.toString();
      const response = await fetch(`/api/observations?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch observations');
      }
      return response.json();
    }
  });
  
  // Fetch all species for filter dropdown
  const { data: species } = useQuery({
    queryKey: ['/api/species'],
    queryFn: async () => {
      const response = await fetch('/api/species');
      if (!response.ok) {
        throw new Error('Failed to fetch species');
      }
      return response.json();
    }
  });
  
  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      type: '',
      species: '',
      verified: '',
      user_id: ''
    });
  };
  
  // Handle show my observations
  const handleShowMyObservations = () => {
    if (user && user.id) {
      setFilters({
        ...filters,
        user_id: user.id
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 handwritten">Biodiversity Map</h1>
        <p className="text-lg text-gray-600 mb-6">
          Explore wildlife observations across Islamabad. See where different species have been spotted.
        </p>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filter Observations</CardTitle>
            <CardDescription>Customize the map view based on your interests</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Species Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="plant">Plants</SelectItem>
                  <SelectItem value="animal">Animals</SelectItem>
                  <SelectItem value="fungi">Fungi</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto">
              <Select 
                value={filters.verified} 
                onValueChange={(value) => setFilters({...filters, verified: value})}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Verification Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="true">Verified Only</SelectItem>
                  <SelectItem value="false">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto">
              <Select 
                value={filters.species} 
                onValueChange={(value) => setFilters({...filters, species: value})}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Species</SelectItem>
                  {species?.map((s: any) => (
                    <SelectItem key={s.id} value={s.scientific_name}>
                      {s.scientific_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
            <Button onClick={handleShowMyObservations} disabled={!user}>My Observations</Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow sketch-border">
        <div className="h-[600px] relative rounded-md overflow-hidden paper-texture">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
              <div className="wildlife-icons plant loading-sketch"></div>
              <p className="ml-2">Loading the biodiversity map...</p>
            </div>
          ) : null}
          
          <MapContainer 
            center={center} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
              mapRef.current = map;
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap position={center} />
            
            {observations?.map((observation: any) => {
              // Skip invalid locations
              if (!observation.location || 
                  !observation.location.coordinates || 
                  !Array.isArray(observation.location.coordinates) || 
                  observation.location.coordinates.length < 2) {
                return null;
              }
              
              // Convert coordinates to [lat, lng] format for Leaflet
              // GeoJSON uses [longitude, latitude] but Leaflet uses [latitude, longitude]
              const position: [number, number] = [
                observation.location.coordinates[1], 
                observation.location.coordinates[0]
              ];
              
              return (
                <Marker 
                  key={observation.id} 
                  position={position}
                  icon={customIcons[observation.type as keyof typeof customIcons] || customIcons.other}
                >
                  <Popup className="species-popup">
                    <div className="p-1">
                      <div className="font-bold">{observation.species_name}</div>
                      <div className="text-sm mb-2">
                        {observation.common_names?.map((name: string, i: number) => (
                          <span key={i} className="mr-1">
                            {name}{i < (observation.common_names?.length - 1) ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Badge className={cn(
                          'font-normal',
                          observation.verified ? 'bg-green-500' : 'bg-yellow-500'
                        )}>
                          {observation.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                        <Badge className="wildlife-icons plant font-normal">{observation.type}</Badge>
                      </div>
                      
                      {observation.image_url && (
                        <div className="mt-1 mb-2">
                          <img 
                            src={observation.image_url} 
                            alt={observation.species_name} 
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                      
                      {observation.description && (
                        <div className="text-sm mt-1">
                          <p>{observation.description}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Observed: {new Date(observation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <div className="wildlife-icons plant mr-2"></div>
              <div>
                <div className="font-bold">Plants</div>
                <div className="text-sm text-gray-600">
                  {observations?.filter((o: any) => o.type === 'plant').length || 0} observations
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center">
              <div className="wildlife-icons animal mr-2"></div>
              <div>
                <div className="font-bold">Animals</div>
                <div className="text-sm text-gray-600">
                  {observations?.filter((o: any) => o.type === 'animal').length || 0} observations
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="wildlife-icons fungi mr-2"></div>
              <div>
                <div className="font-bold">Fungi</div>
                <div className="text-sm text-gray-600">
                  {observations?.filter((o: any) => o.type === 'fungi').length || 0} observations
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="wildlife-icons location mr-2"></div>
              <div>
                <div className="font-bold">Others</div>
                <div className="text-sm text-gray-600">
                  {observations?.filter((o: any) => o.type === 'other').length || 0} observations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}