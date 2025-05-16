import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Search, Filter, Grid3X3, List, Camera, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ObservationsPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  
  // Fetch user's observations
  const { data: observations, isLoading, isError } = useQuery({
    queryKey: ['/api/observations'],
    staleTime: 60000, // 1 minute
  });
  
  // Filter and sort observations based on user selection
  const filteredObservations = React.useMemo(() => {
    if (!observations) return [];
    
    return observations
      .filter((obs: any) => {
        // Filter by user ID
        const userMatch = obs.userId === (user?.id || 'user-123'); // Fallback for testing
        
        // Filter by type
        const typeMatch = filterType === 'all' || 
          (obs.type && obs.type === filterType);
        
        // Filter by search term (match species name or common names)
        const searchMatch = !searchTerm || 
          obs.speciesName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (obs.commonNames && obs.commonNames.some((name: string) => 
            name.toLowerCase().includes(searchTerm.toLowerCase())
          ));
        
        return userMatch && typeMatch && searchMatch;
      })
      .sort((a: any, b: any) => {
        // Sort by date
        if (sortOrder === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      });
  }, [observations, searchTerm, sortOrder, filterType, user]);
  
  // Get statistics about user's observations
  const stats = React.useMemo(() => {
    if (!filteredObservations.length) {
      return {
        total: 0,
        plants: 0,
        animals: 0,
        fungi: 0,
        other: 0,
        pointsEarned: 0,
      };
    }
    
    return filteredObservations.reduce((acc: any, obs: any) => {
      acc.total++;
      
      // Count by type
      if (obs.type === 'plant') acc.plants++;
      else if (obs.type === 'animal') acc.animals++;
      else if (obs.type === 'fungi') acc.fungi++;
      else acc.other++;
      
      // Sum points
      acc.pointsEarned += obs.pointsAwarded || 0;
      
      return acc;
    }, {
      total: 0,
      plants: 0,
      animals: 0,
      fungi: 0,
      other: 0,
      pointsEarned: 0,
    });
  }, [filteredObservations]);
  
  // Render grid item
  const renderGridItem = (observation: any) => (
    <Card key={observation._id || observation.id} className="overflow-hidden">
      <div className="relative h-40">
        <img 
          src={observation.imageUrl} 
          alt={observation.speciesName}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={observation.verified ? "default" : "outline"}>
            {observation.verified ? "Verified" : "Unverified"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold truncate">{observation.speciesName}</h3>
              {observation.commonNames && observation.commonNames.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  {observation.commonNames.join(', ')}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {observation.type || 'Unknown'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Islamabad</span>
            </div>
            <span>{new Date(observation.createdAt).toLocaleDateString()}</span>
          </div>
          
          {observation.pointsAwarded > 0 && (
            <div className="text-sm font-medium text-primary">
              +{observation.pointsAwarded} points
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 border-t bg-muted/30">
        <Button variant="ghost" size="sm" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
  
  // Render list item
  const renderListItem = (observation: any) => (
    <Card key={observation._id || observation.id} className="overflow-hidden">
      <div className="flex p-4">
        <div className="w-20 h-20 overflow-hidden rounded-md flex-shrink-0">
          <img 
            src={observation.imageUrl} 
            alt={observation.speciesName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex justify-between">
            <div>
              <h3 className="font-semibold">{observation.speciesName}</h3>
              {observation.commonNames && observation.commonNames.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {observation.commonNames.join(', ')}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={observation.verified ? "default" : "outline"} className="text-xs">
                {observation.verified ? "Verified" : "Unverified"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {observation.type || 'Unknown'}
              </Badge>
            </div>
          </div>
          
          {observation.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {observation.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Islamabad</span>
              </div>
              <span>{new Date(observation.createdAt).toLocaleDateString()}</span>
            </div>
            
            {observation.pointsAwarded > 0 && (
              <div className="text-sm font-medium text-primary">
                +{observation.pointsAwarded} points
              </div>
            )}
          </div>
        </div>
      </div>
      <CardFooter className="px-4 py-2 border-t bg-muted/30">
        <Button variant="ghost" size="sm" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Observations</h1>
          <p className="text-muted-foreground">
            Track your contributions to BioScout Islamabad
          </p>
        </div>
        <Button asChild>
          <Link href="/identify">
            <Camera className="mr-2 h-4 w-4" />
            Add New Observation
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pointsEarned}</div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Species Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Plants:</span>
                  <span className="font-medium">{stats.plants}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Animals:</span>
                  <span className="font-medium">{stats.animals}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Fungi:</span>
                  <span className="font-medium">{stats.fungi}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Other:</span>
                  <span className="font-medium">{stats.other}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="observations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="observations" className="space-y-4">
          {/* Filters and controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search observations..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="plant">Plants</SelectItem>
                  <SelectItem value="animal">Animals</SelectItem>
                  <SelectItem value="fungi">Fungi</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md overflow-hidden">
                <Button 
                  variant={view === 'grid' ? 'default' : 'ghost'} 
                  size="icon"
                  onClick={() => setView('grid')}
                  className="rounded-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={view === 'list' ? 'default' : 'ghost'} 
                  size="icon"
                  onClick={() => setView('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading observations...</span>
            </div>
          ) : isError ? (
            <Card className="p-6 text-center bg-destructive/10 border-destructive">
              <p>Failed to load observations. Please try again later.</p>
              <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Card>
          ) : filteredObservations.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No observations found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== 'all' 
                  ? "Try adjusting your filters" 
                  : "You haven't recorded any observations yet"}
              </p>
              <Button asChild>
                <Link href="/identify">
                  <Camera className="mr-2 h-4 w-4" />
                  Add Your First Observation
                </Link>
              </Button>
            </Card>
          ) : (
            <div className={
              view === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            }>
              {view === 'grid'
                ? filteredObservations.map((obs: any) => renderGridItem(obs))
                : filteredObservations.map((obs: any) => renderListItem(obs))
              }
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Observation Map</CardTitle>
              <CardDescription>
                View your observations on a map of Islamabad
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Map view will show your observations geographically</p>
                <Button asChild>
                  <Link href="/map">
                    <MapPin className="mr-2 h-4 w-4" />
                    Open Full Map
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}