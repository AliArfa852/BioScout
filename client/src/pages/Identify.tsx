import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, Upload, Leaf, MapPin, CheckCircle, XCircle, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import '../styles/wildlife-theme.css';

// Form schema for observation submission
const formSchema = z.object({
  image: z.any().refine((file) => file?.length > 0, "Image is required"),
  species_name: z.string().optional(),
  common_names: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["plant", "animal", "fungi", "other"]).default("other"),
  latitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Valid latitude is required"
  }),
  longitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Valid longitude is required"
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function IdentifyPage() {
  const { user, isAuthenticated } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: undefined,
      species_name: '',
      common_names: '',
      description: '',
      type: 'other',
      latitude: '',
      longitude: '',
    },
  });
  
  // Fetch user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude.toString());
          form.setValue('longitude', position.coords.longitude.toString());
          setLocationStatus('success');
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationStatus('error');
          toast({
            title: "Location access denied",
            description: "Please enable location access or enter coordinates manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationStatus('error');
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation. Please enter coordinates manually.",
        variant: "destructive",
      });
    }
  }, [form, toast]);
  
  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Set the image in the form
      form.setValue('image', event.target.files);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset identification result when new image is selected
      setIdentificationResult(null);
    }
  };
  
  // Handle camera capture
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Identify image without submitting
  const handleIdentify = async () => {
    const file = form.getValues('image')?.[0];
    if (!file) {
      toast({
        title: "No image selected",
        description: "Please upload or capture an image first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsIdentifying(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to identify species');
      }
      
      const result = await response.json();
      setIdentificationResult(result);
      
      // Auto-fill form fields based on identification result
      if (result.species) {
        form.setValue('species_name', result.species);
      }
      
      if (result.type) {
        form.setValue('type', result.type);
      }
      
      toast({
        title: "Image identified",
        description: `Identified as ${result.species || 'Unknown'} with ${Math.round(result.confidence * 100)}% confidence`,
      });
    } catch (error) {
      console.error('Error identifying species:', error);
      toast({
        title: "Identification failed",
        description: "Could not identify the species. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsIdentifying(false);
    }
  };
  
  // Mutation for submitting observation
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to submit observations');
      }
      
      const file = data.image[0];
      const formData = new FormData();
      
      // Append all form data
      formData.append('image', file);
      formData.append('species_name', data.species_name || identificationResult?.species || 'Unknown');
      formData.append('common_names', data.common_names || '[]');
      formData.append('description', data.description || '');
      formData.append('type', data.type);
      formData.append('latitude', data.latitude);
      formData.append('longitude', data.longitude);
      
      // Add authorization header
      const response = await fetch('/api/identify/upload', {
        method: 'POST',
        headers: {
          'Authorization': user?.id || '',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit observation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      
      // Show success message
      toast({
        title: "Observation submitted successfully!",
        description: `You earned ${data.observation.points_awarded} points for this observation.`,
      });
      
      // Navigate to the observation detail page
      navigate(`/observations/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit observation. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    submitMutation.mutate(data);
  };
  
  // Loading state for species data
  const { data: speciesData, isLoading: loadingSpecies } = useQuery({
    queryKey: ['/api/species'],
    queryFn: async () => {
      const response = await fetch('/api/species');
      if (!response.ok) {
        throw new Error('Failed to fetch species data');
      }
      return response.json();
    },
    enabled: identificationResult !== null,
  });
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 handwritten">Identify Species</h1>
        <p className="text-lg text-gray-600 mb-6">
          Upload an image to identify plant and animal species in Islamabad. 
          Add your observation to our database to help map biodiversity.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image upload section */}
        <Card className="wildlife-decoration leaf">
          <CardHeader>
            <CardTitle>Capture or Upload Image</CardTitle>
            <CardDescription>
              Take a clear photo of the species you want to identify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors",
                  "min-h-[300px] flex flex-col items-center justify-center",
                  imagePreview ? "border-green-300 bg-green-50" : "border-gray-300"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-[280px] max-w-full object-contain rounded-md" 
                  />
                ) : (
                  <>
                    <Upload className="h-16 w-16 text-gray-400 mb-2" />
                    <p className="text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-gray-400 text-sm mt-1">JPG, PNG, WEBP (max 5MB)</p>
                  </>
                )}
                <Input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                  {...form.register('image')}
                />
              </div>
              {form.formState.errors.image && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.image.message as string}</p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleCameraCapture}
              >
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
              <Button 
                type="button" 
                variant="default" 
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                setImagePreview(null);
                setIdentificationResult(null);
                form.reset();
              }}
              disabled={!imagePreview}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button 
              type="button"
              onClick={handleIdentify}
              disabled={!imagePreview || isIdentifying}
              className="bg-primary"
            >
              <Leaf className="mr-2 h-4 w-4" />
              {isIdentifying ? 'Identifying...' : 'Identify Species'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Form section */}
        <Card>
          <CardHeader>
            <CardTitle>Species Details</CardTitle>
            <CardDescription>
              Add details about your observation for submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Identification Result */}
                {identificationResult && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Identification Result</h3>
                        <div className="mt-2">
                          <p className="text-sm text-green-700">
                            Species: <span className="font-semibold">{identificationResult.species}</span>
                          </p>
                          <p className="text-sm text-green-700">
                            Type: <span className="font-semibold">{identificationResult.type}</span>
                          </p>
                          <p className="text-sm text-green-700">
                            Confidence: <span className="font-semibold">{Math.round(identificationResult.confidence * 100)}%</span>
                          </p>
                          <Progress 
                            value={Math.round(identificationResult.confidence * 100)} 
                            className="h-2 mt-1" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Species Name */}
                <FormField
                  control={form.control}
                  name="species_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Scientific name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the scientific name if known
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Common Names */}
                <FormField
                  control={form.control}
                  name="common_names"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Common Names</FormLabel>
                      <FormControl>
                        <Input placeholder="Comma-separated common names" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter one or more common names, separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Species Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="plant">Plant</SelectItem>
                          <SelectItem value="animal">Animal</SelectItem>
                          <SelectItem value="fungi">Fungi</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the type of species
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Location Status */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {locationStatus === 'loading' && <span>Getting your location...</span>}
                  {locationStatus === 'success' && <span className="text-green-600">Location detected</span>}
                  {locationStatus === 'error' && <span className="text-red-600">Location access denied</span>}
                </div>
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes or observations" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Describe the surroundings, behavior, or any other details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Similar Species */}
                {identificationResult && speciesData && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Similar Species:</h3>
                    <div className="flex flex-wrap gap-2">
                      {speciesData
                        .filter((s: any) => s.type === identificationResult.type && s.scientific_name !== identificationResult.species)
                        .slice(0, 3)
                        .map((s: any) => (
                          <Badge 
                            key={s.id} 
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => form.setValue('species_name', s.scientific_name)}
                          >
                            {s.scientific_name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="pt-4">
                  <Separator className="mb-4" />
                  
                  {!isAuthenticated ? (
                    <Alert variant="warning" className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Login required</AlertTitle>
                      <AlertDescription>
                        You need to log in to submit observations and earn points.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitMutation.isPending || !isAuthenticated || !imagePreview}
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Observation'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {/* How it works section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Learn how to identify and submit species observations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-light mb-4">
                <Camera className="h-6 w-6 text-primary-dark" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Capture or Upload</h3>
              <p className="text-gray-600">
                Take a clear photo of the species or upload an existing image.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-light mb-4">
                <Leaf className="h-6 w-6 text-primary-dark" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Identify Species</h3>
              <p className="text-gray-600">
                Our AI identifies the species, or you can manually input the details.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-light mb-4">
                <MapPin className="h-6 w-6 text-primary-dark" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Add to Biodiversity Map</h3>
              <p className="text-gray-600">
                Your observation is added to our database and map, earning you points.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}