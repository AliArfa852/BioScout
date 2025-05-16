import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart4, PieChart, Map } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell
} from 'recharts';
import '../styles/wildlife-theme.css';

const COLORS = ['#50865e', '#d89a63', '#eb6d56', '#6d88cd', '#9c5ab8', '#2d9cb4'];

export default function SpeciesComparison() {
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [comparisonType, setComparisonType] = useState('monthly');
  const [chartType, setChartType] = useState('distribution');
  
  // Fetch all species
  const { data: species, isLoading: loadingSpecies } = useQuery({
    queryKey: ['/api/species'],
    queryFn: async () => {
      const response = await fetch('/api/species');
      if (!response.ok) throw new Error('Failed to fetch species');
      return response.json();
    }
  });
  
  // Fetch all observations
  const { data: observations, isLoading: loadingObservations } = useQuery({
    queryKey: ['/api/observations'],
    queryFn: async () => {
      const response = await fetch('/api/observations');
      if (!response.ok) throw new Error('Failed to fetch observations');
      return response.json();
    }
  });
  
  // Handle adding a species to comparison
  const handleAddSpecies = (value: string) => {
    if (value && !selectedSpecies.includes(value)) {
      setSelectedSpecies([...selectedSpecies, value]);
    }
  };
  
  // Handle removing a species from comparison
  const handleRemoveSpecies = (value: string) => {
    setSelectedSpecies(selectedSpecies.filter(s => s !== value));
  };
  
  // Prepare comparison data based on selected type
  const getComparisonData = () => {
    if (!observations || selectedSpecies.length === 0) return [];
    
    switch (chartType) {
      case 'distribution':
        return getDistributionData();
      case 'monthly':
        return getMonthlyData();
      case 'type':
        return getTypeDistributionData();
      case 'verification':
        return getVerificationData();
      default:
        return [];
    }
  };
  
  // Get distribution data (count by species)
  const getDistributionData = () => {
    const filtered = observations.filter((o: any) => 
      selectedSpecies.includes(o.species_name)
    );
    
    const counts: Record<string, number> = {};
    selectedSpecies.forEach(s => { counts[s] = 0; }); // Initialize all selected species
    
    filtered.forEach((o: any) => {
      counts[o.species_name] = (counts[o.species_name] || 0) + 1;
    });
    
    return Object.keys(counts).map(name => ({
      name: name,
      count: counts[name]
    }));
  };
  
  // Get monthly distribution data
  const getMonthlyData = () => {
    if (!observations || selectedSpecies.length === 0) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: any[] = months.map(month => ({ month }));
    
    selectedSpecies.forEach(species => {
      const speciesObs = observations.filter((o: any) => o.species_name === species);
      
      months.forEach((month, idx) => {
        const monthCount = speciesObs.filter((o: any) => {
          const obsDate = new Date(o.created_at);
          return obsDate.getMonth() === idx;
        }).length;
        
        monthlyData[idx][species] = monthCount;
      });
    });
    
    return monthlyData;
  };
  
  // Get type distribution data
  const getTypeDistributionData = () => {
    if (!observations || selectedSpecies.length === 0) return [];
    
    const types = ['plant', 'animal', 'fungi', 'other'];
    const typeData: any[] = [];
    
    selectedSpecies.forEach(species => {
      const speciesObs = observations.filter((o: any) => o.species_name === species);
      
      types.forEach(type => {
        const typeCount = speciesObs.filter((o: any) => o.type === type).length;
        if (typeCount > 0) {
          typeData.push({
            species,
            type,
            count: typeCount
          });
        }
      });
    });
    
    return typeData;
  };
  
  // Get verification status data
  const getVerificationData = () => {
    if (!observations || selectedSpecies.length === 0) return [];
    
    const verificationData: any[] = [];
    
    selectedSpecies.forEach(species => {
      const speciesObs = observations.filter((o: any) => o.species_name === species);
      const verifiedCount = speciesObs.filter((o: any) => o.verified).length;
      const unverifiedCount = speciesObs.length - verifiedCount;
      
      verificationData.push({
        name: species,
        verified: verifiedCount,
        unverified: unverifiedCount
      });
    });
    
    return verificationData;
  };
  
  // Get location heatmap data
  const getLocationHeatmapData = () => {
    if (!observations || selectedSpecies.length === 0) return [];
    
    const locationCounts: Record<string, number> = {};
    
    const filteredObs = observations.filter((o: any) => 
      selectedSpecies.includes(o.species_name) && 
      o.location && 
      o.location.coordinates
    );
    
    filteredObs.forEach((o: any) => {
      // Round coordinates to create location clusters
      const lat = Math.round(o.location.coordinates[1] * 1000) / 1000;
      const lng = Math.round(o.location.coordinates[0] * 1000) / 1000;
      const key = `${lat},${lng}`;
      
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    });
    
    return Object.entries(locationCounts).map(([key, count]) => {
      const [lat, lng] = key.split(',').map(Number);
      return { lat, lng, count };
    });
  };
  
  const renderChart = () => {
    const data = getComparisonData();
    
    if (data.length === 0) {
      return (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            Select species to compare or try different comparison options
          </AlertDescription>
        </Alert>
      );
    }
    
    switch (chartType) {
      case 'distribution':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ background: 'var(--color-bg-card)' }} />
              <Legend />
              <Bar dataKey="count" fill="var(--color-primary)" name="Observations Count" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip contentStyle={{ background: 'var(--color-bg-card)' }} />
              <Legend />
              {selectedSpecies.map((species, index) => (
                <Bar key={species} dataKey={species} fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'type':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="species" />
              <YAxis />
              <Tooltip contentStyle={{ background: 'var(--color-bg-card)' }} />
              <Legend />
              <Bar dataKey="count" fill="var(--color-primary)" name="Count by Type" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'verification':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ background: 'var(--color-bg-card)' }} />
              <Legend />
              <Bar dataKey="verified" fill="var(--color-success)" name="Verified" stackId="a" />
              <Bar dataKey="unverified" fill="var(--color-warning)" name="Unverified" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };
  
  const renderPieChart = () => {
    const data = getDistributionData();
    
    if (data.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            Select species to compare or try different comparison options
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <RPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill="#8884d8"
            dataKey="count"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--color-bg-card)' }} />
          <Legend />
        </RPieChart>
      </ResponsiveContainer>
    );
  };
  
  // Loading state
  if (loadingSpecies || loadingObservations) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <h1 className="text-3xl font-bold mb-2 handwritten">Species Comparison</h1>
        <div className="flex items-center mt-8 justify-center">
          <div className="wildlife-icons plant loading-sketch"></div>
          <p className="ml-2">Loading comparison data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 handwritten">Species Comparison</h1>
        <p className="text-lg text-gray-600 mb-6">
          Compare different species observations and insights. Track seasonal patterns and distribution.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Select Species to Compare</CardTitle>
            <CardDescription>Choose up to 5 species to visualize and compare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Select onValueChange={handleAddSpecies} disabled={selectedSpecies.length >= 5}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a species to compare" />
                </SelectTrigger>
                <SelectContent>
                  {species?.map((s: any) => (
                    <SelectItem 
                      key={s.id} 
                      value={s.scientific_name}
                      disabled={selectedSpecies.includes(s.scientific_name)}
                    >
                      {s.scientific_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSpecies.map((name, index) => (
                  <div 
                    key={name} 
                    className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    style={{ backgroundColor: `${COLORS[index % COLORS.length]}25`, color: COLORS[index % COLORS.length] }}
                  >
                    {name}
                    <button 
                      className="rounded-full bg-white w-4 h-4 flex items-center justify-center text-xs"
                      onClick={() => handleRemoveSpecies(name)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Visualization Options</CardTitle>
            <CardDescription>Choose how to visualize the comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Chart Type</label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distribution">Overall Distribution</SelectItem>
                    <SelectItem value="monthly">Monthly Comparison</SelectItem>
                    <SelectItem value="type">Type Distribution</SelectItem>
                    <SelectItem value="verification">Verification Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {selectedSpecies.length > 0 ? (
        <Tabs defaultValue="bar" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="bar" className="flex items-center gap-2">
                <BarChart4 className="w-4 h-4" />
                <span>Bar Chart</span>
              </TabsTrigger>
              <TabsTrigger value="pie" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                <span>Pie Chart</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                <span>Location Map</span>
              </TabsTrigger>
            </TabsList>
          </div>
        
          <Card className="wildlife-decoration leaf">
            <CardContent className="pt-6">
              <TabsContent value="bar">
                {renderChart()}
              </TabsContent>
              <TabsContent value="pie">
                {renderPieChart()}
              </TabsContent>
              <TabsContent value="map">
                <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
                  <p>Map visualization coming soon</p>
                </div>
              </TabsContent>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-gray-500 w-full">
                <p>Comparing {selectedSpecies.length} species with total {observations?.length || 0} observations available in database</p>
              </div>
            </CardFooter>
          </Card>
        </Tabs>
      ) : (
        <Card className="p-8 text-center">
          <div className="wildlife-icons plant mx-auto mb-4"></div>
          <CardTitle className="mb-2">No Species Selected</CardTitle>
          <CardDescription>
            Select at least one species to start comparing
          </CardDescription>
        </Card>
      )}
      
      {/* Insights section */}
      {selectedSpecies.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Species Insights</CardTitle>
            <CardDescription>Key statistics and information about selected species</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedSpecies.map((speciesName, index) => {
                const speciesData = species?.find((s: any) => s.scientific_name === speciesName);
                const speciesObs = observations?.filter((o: any) => o.species_name === speciesName) || [];
                
                if (!speciesData) return null;
                
                return (
                  <div key={speciesName} className="pb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      {speciesName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{speciesData.common_names?.join(', ')}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="border rounded-md p-3">
                        <div className="text-sm text-gray-500">Observations</div>
                        <div className="text-2xl font-bold">{speciesObs.length}</div>
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="text-sm text-gray-500">Verification Rate</div>
                        <div className="text-2xl font-bold">
                          {speciesObs.length 
                            ? `${Math.round((speciesObs.filter((o: any) => o.verified).length / speciesObs.length) * 100)}%` 
                            : '0%'}
                        </div>
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="text-sm text-gray-500">Type</div>
                        <div className="text-2xl font-bold wildlife-icons plant">{speciesData.type}</div>
                      </div>
                    </div>
                    
                    {index < selectedSpecies.length - 1 && <Separator className="mt-4" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}