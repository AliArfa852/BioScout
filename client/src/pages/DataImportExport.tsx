import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  FileUp, 
  FileDown, 
  AlertCircle, 
  Check, 
  Loader2, 
  Table, 
  FileSpreadsheet,
  Info,
  FileText,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function DataImportExportPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStats, setImportStats] = useState<any>(null);
  
  // Filter states for export
  const [speciesFilter, setSpeciesFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [observerFilter, setObserverFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  // Fetch observation stats for the dashboard
  const { data: obsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/data/observation-stats'],
    queryFn: async () => {
      const response = await fetch('/api/data/observation-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch observation statistics');
      }
      return response.json();
    }
  });
  
  // Generate new observation ID
  const { data: newObsId, refetch: refetchNewId } = useQuery({
    queryKey: ['/api/data/generate-id'],
    queryFn: async () => {
      const response = await fetch('/api/data/generate-id');
      if (!response.ok) {
        throw new Error('Failed to generate observation ID');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // CSV Import mutation
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/data/import-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import CSV');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'CSV Import Successful',
        description: data.message,
        variant: 'default',
      });
      
      setImportStats(data.stats);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'CSV Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle CSV import
  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Only CSV files are supported',
        variant: 'destructive',
      });
      return;
    }
    
    // Create FormData and append file
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Start import
    importMutation.mutate(formData);
  };
  
  // Handle CSV export - direct download
  const handleExport = () => {
    // Build query params
    const params = new URLSearchParams();
    
    if (speciesFilter) params.append('species', speciesFilter);
    if (locationFilter) params.append('location', locationFilter);
    if (observerFilter) params.append('observer', observerFilter);
    if (startDateFilter) params.append('start_date', startDateFilter);
    if (endDateFilter) params.append('end_date', endDateFilter);
    
    // Construct URL with query params
    const exportUrl = `/api/data/export-csv?${params.toString()}`;
    
    // Open in new tab/download
    window.open(exportUrl, '_blank');
  };
  
  // CSV format example
  const csvFormatExample = `observation_id,species_name,common_name,date_observed,location,image_url,notes,observer
OBS0001,Aquila rapax,Tawny Eagle,5/5/2025,Trail 2 Margalla Hills,https://example.com/eagle.jpg,Seen basking in sun near rocks,Manahil
OBS0002,Ceryle rudis,Pied Kingfisher,5/2/2025,Rawal Lake,https://example.com/kingfisher.jpg,Flock moving in coordinated pattern,Shitba`;
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 handwritten">Biodiversity Data Management</h1>
        <p className="text-lg text-gray-600">
          Import and export observation data in standardized CSV format.
          Maintain consistent datasets for the BioScout Islamabad database.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main content */}
        <div className="md:col-span-8">
          <Tabs defaultValue="import">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                <span>Import Data</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                <span>Export Data</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Import Tab */}
            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle>Import Observations from CSV</CardTitle>
                  <CardDescription>
                    Upload standardized CSV data to add or update observations in the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert variant="outline" className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle>CSV Format Requirements</AlertTitle>
                      <AlertDescription className="text-sm">
                        Your CSV must include these columns: <code>observation_id</code>, <code>species_name</code>, <code>common_name</code>, <code>date_observed</code>, <code>location</code>, <code>image_url</code>, <code>notes</code>, <code>observer</code>
                        <div className="mt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileText className="h-3 w-3 mr-1" />
                                View Example
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>CSV Format Example</DialogTitle>
                                <DialogDescription>
                                  Your CSV file should match this format exactly
                                </DialogDescription>
                              </DialogHeader>
                              <div className="text-xs font-mono overflow-x-auto p-4 bg-gray-50 rounded-md border">
                                {csvFormatExample.split('\n').map((line, i) => (
                                  <div key={i} className={i === 0 ? "font-bold" : ""}>
                                    {line}
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    {/* File upload */}
                    <div>
                      <div className="flex items-center gap-4">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          id="csv-upload"
                          disabled={importMutation.isPending}
                        />
                        <Button 
                          onClick={handleImport}
                          disabled={!selectedFile || importMutation.isPending}
                        >
                          {importMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <FileUp className="h-4 w-4 mr-2" />
                              Import
                            </>
                          )}
                        </Button>
                      </div>
                      {selectedFile && (
                        <p className="text-sm text-gray-500 mt-2">
                          Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                        </p>
                      )}
                    </div>
                    
                    {/* Import results */}
                    {importStats && (
                      <Card className="bg-gray-50">
                        <CardHeader className="py-4 px-6">
                          <CardTitle className="text-base">Import Results</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">Total Processed</div>
                              <div className="text-2xl font-bold">{importStats.total}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">Inserted</div>
                              <div className="text-2xl font-bold text-green-600">{importStats.inserted}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">Updated</div>
                              <div className="text-2xl font-bold text-blue-600">{importStats.updated}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">Errors</div>
                              <div className="text-2xl font-bold text-red-600">{importStats.errors}</div>
                            </div>
                          </div>
                          
                          {/* Success message */}
                          <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-200 flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                            <div className="text-sm text-green-800">
                              Successfully processed CSV data and updated the RAG knowledge base.
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Export Tab */}
            <TabsContent value="export">
              <Card>
                <CardHeader>
                  <CardTitle>Export Observations to CSV</CardTitle>
                  <CardDescription>
                    Download observation data in standardized CSV format with optional filtering
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Filters */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Filter Options (Optional)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-gray-600" htmlFor="species-filter">
                            Species
                          </label>
                          <Input
                            id="species-filter"
                            placeholder="Filter by species name"
                            value={speciesFilter}
                            onChange={(e) => setSpeciesFilter(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm text-gray-600" htmlFor="location-filter">
                            Location
                          </label>
                          <Input
                            id="location-filter"
                            placeholder="Filter by location"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm text-gray-600" htmlFor="observer-filter">
                            Observer
                          </label>
                          <Input
                            id="observer-filter"
                            placeholder="Filter by observer name"
                            value={observerFilter}
                            onChange={(e) => setObserverFilter(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm text-gray-600" htmlFor="date-range">
                            Date Range
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="start-date"
                              type="date"
                              placeholder="Start date"
                              value={startDateFilter}
                              onChange={(e) => setStartDateFilter(e.target.value)}
                            />
                            <span>to</span>
                            <Input
                              id="end-date"
                              type="date"
                              placeholder="End date"
                              value={endDateFilter}
                              onChange={(e) => setEndDateFilter(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Export button */}
                    <div className="flex justify-end">
                      <Button onClick={handleExport}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export to CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-4">
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {obsStats?.stats ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border rounded-md p-3">
                            <div className="text-sm text-gray-500">Observations</div>
                            <div className="text-xl font-bold">{obsStats.stats.total_observations}</div>
                          </div>
                          <div className="border rounded-md p-3">
                            <div className="text-sm text-gray-500">Species</div>
                            <div className="text-xl font-bold">{obsStats.stats.total_species}</div>
                          </div>
                        </div>
                        
                        {obsStats.stats.most_recent && (
                          <div className="p-3 border rounded-md bg-gray-50">
                            <div className="text-sm font-medium mb-1">Latest Observation</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex gap-2">
                                <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{obsStats.stats.most_recent.date_observed}</span>
                              </div>
                              <div>{obsStats.stats.most_recent.species_name}</div>
                              <div>{obsStats.stats.most_recent.location}</div>
                            </div>
                          </div>
                        )}
                        
                        {obsStats.stats.type_distribution && (
                          <div>
                            <div className="text-sm font-medium mb-2">Type Distribution</div>
                            <div className="space-y-2">
                              {Object.entries(obsStats.stats.type_distribution).map(([type, count]: [string, any]) => (
                                <div key={type} className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-3 h-3 rounded-full",
                                      type === 'plant' ? 'bg-green-500' :
                                      type === 'animal' ? 'bg-amber-500' :
                                      type === 'fungi' ? 'bg-red-500' :
                                      'bg-blue-500'
                                    )} />
                                    <span className="text-sm capitalize">{type}</span>
                                  </div>
                                  <span className="text-sm font-medium">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No statistics available</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Next Observation ID */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Next Observation ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center p-4 border rounded-md bg-gray-50">
                  <div className="text-2xl font-mono font-bold text-primary mb-1">
                    {newObsId?.observation_id || '...'}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Use this ID for your next observation</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchNewId()}
                    className="w-full"
                  >
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Generate New ID
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">CSV Format Guide</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Your CSV file should follow this exact format with the following columns:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">observation_id</Badge>
                      <div className="text-xs text-gray-600">Unique identifier (e.g., OBS0001)</div>
                    </div>
                    
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">species_name</Badge>
                      <div className="text-xs text-gray-600">Scientific name (e.g., Aquila rapax)</div>
                    </div>
                    
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">common_name</Badge>
                      <div className="text-xs text-gray-600">Common name(s) separated by commas</div>
                    </div>
                    
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">date_observed</Badge>
                      <div className="text-xs text-gray-600">Date in MM/DD/YYYY format</div>
                    </div>
                    
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">location</Badge>
                      <div className="text-xs text-gray-600">Specific location in Islamabad</div>
                    </div>
                    
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">image_url</Badge>
                      <div className="text-xs text-gray-600">URL to observation image</div>
                    </div>
                    
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">notes</Badge>
                      <div className="text-xs text-gray-600">Additional observation details</div>
                    </div>
                    
                    <div className="flex items-start">
                      <Badge variant="outline" className="mt-0.5 mr-2 w-32 justify-center">observer</Badge>
                      <div className="text-xs text-gray-600">Name of the person who made the observation</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}