import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Filter, Info } from 'lucide-react';

export default function SpeciesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Fetch species data
  const { data: species, isLoading, isError } = useQuery({
    queryKey: ['/api/species'],
    staleTime: 3600000, // 1 hour
  });
  
  // Filter species based on search term and type
  const filteredSpecies = React.useMemo(() => {
    if (!species) return [];
    
    return species.filter((sp: any) => {
      // Filter by type
      const typeMatch = filterType === 'all' || sp.type === filterType;
      
      // Filter by search term (match scientific name or common names)
      const searchMatch = !searchTerm || 
        sp.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.commonNames.some((name: string) => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return typeMatch && searchMatch;
    });
  }, [species, searchTerm, filterType]);
  
  // Group species by type for the catalog view
  const groupedSpecies = React.useMemo(() => {
    const grouped: Record<string, any[]> = {
      plant: [],
      animal: [],
      fungi: [],
      other: []
    };
    
    if (filteredSpecies.length > 0) {
      filteredSpecies.forEach((sp: any) => {
        const type = sp.type || 'other';
        if (grouped[type]) {
          grouped[type].push(sp);
        } else {
          grouped.other.push(sp);
        }
      });
    }
    
    return grouped;
  }, [filteredSpecies]);
  
  // Render a species card
  const renderSpeciesCard = (species: any) => (
    <Card key={species._id || species.id} className="overflow-hidden">
      <div className="relative h-48">
        <img 
          src={species.imageUrls?.[0] || 'https://via.placeholder.com/300?text=No+Image'} 
          alt={species.scientificName}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            {species.type.charAt(0).toUpperCase() + species.type.slice(1)}
          </Badge>
        </div>
        {species.isEndemic && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-primary/80 backdrop-blur-sm">
              Endemic to Region
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg">{species.scientificName}</h3>
        {species.commonNames && species.commonNames.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {species.commonNames.join(', ')}
          </p>
        )}
        <p className="text-sm mt-2 line-clamp-3">
          {species.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          Habitat: {species.habitat}
        </div>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
  
  // Create sections for catalog view
  const renderCatalogSection = (title: string, sectionSpecies: any[]) => {
    if (sectionSpecies.length === 0) return null;
    
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionSpecies.map(renderSpeciesCard)}
        </div>
      </div>
    );
  };
  
  // Define catalog section titles
  const catalogSections = [
    { key: 'plant', title: 'Plants of Islamabad' },
    { key: 'animal', title: 'Animals of Islamabad' },
    { key: 'fungi', title: 'Fungi of Islamabad' },
    { key: 'other', title: 'Other Species' }
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Species Catalog</h1>
        <p className="text-muted-foreground">
          Explore the biodiversity of plants, animals, and fungi in the Islamabad region
        </p>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search species by name..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="plant">Plants</SelectItem>
            <SelectItem value="animal">Animals</SelectItem>
            <SelectItem value="fungi">Fungi</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Main content */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading species data...</span>
            </div>
          ) : isError ? (
            <Card className="p-6 text-center bg-destructive/10 border-destructive">
              <p>Failed to load species data. Please try again later.</p>
              <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Card>
          ) : filteredSpecies.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No species found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button onClick={() => { setSearchTerm(''); setFilterType('all'); }}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpecies.map(renderSpeciesCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="catalog" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading species data...</span>
            </div>
          ) : isError ? (
            <Card className="p-6 text-center bg-destructive/10 border-destructive">
              <p>Failed to load species data. Please try again later.</p>
              <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Card>
          ) : filteredSpecies.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No species found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button onClick={() => { setSearchTerm(''); setFilterType('all'); }}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            <>
              {catalogSections.map(section => (
                filterType === 'all' || filterType === section.key
                  ? renderCatalogSection(section.title, groupedSpecies[section.key])
                  : null
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Information card */}
      <Card className="bg-muted/30">
        <CardHeader className="flex flex-row items-start space-x-4 pb-2">
          <Info className="h-5 w-5 text-primary mt-1" />
          <div>
            <CardTitle>About Islamabad's Biodiversity</CardTitle>
            <CardDescription>
              Key facts about the region's ecosystem
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Margalla Hills National Park</h3>
              <p className="text-sm">
                Home to over 600 plant species, 250 bird varieties, and numerous mammals including monkeys, foxes, and the occasional leopard.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Urban Green Spaces</h3>
              <p className="text-sm">
                Islamabad's parks, gardens, and reserves provide habitats for diverse plant species and urban wildlife.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Rawal Lake</h3>
              <p className="text-sm">
                This reservoir supports various aquatic species and serves as a habitat for migratory birds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}