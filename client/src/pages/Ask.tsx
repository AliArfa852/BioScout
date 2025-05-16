import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bird, Send, Leaf, AlertCircle, BookOpen, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import '../styles/wildlife-theme.css';

// Message type definition
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: string[];
  related_species?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export default function AskPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: 'Hello! I\'m BioScout, your biodiversity guide for Islamabad. Ask me anything about local flora and fauna!',
      timestamp: new Date(),
    }
  ]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'What birds are commonly found in Margalla Hills?',
    'Tell me about endangered plant species in Islamabad',
    'How has urbanization affected local wildlife?',
    'What medicinal plants grow in this region?'
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.id || '',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Add answer to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          sources: data.sources_used,
          related_species: data.related_species_ids?.map((s: any) => ({
            id: s.id,
            name: s.name,
            type: s.type,
          })),
        },
      ]);

      // Generate new suggested questions based on context
      if (data.suggested_questions && data.suggested_questions.length > 0) {
        setSuggestedQuestions(data.suggested_questions);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to get answer',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm sorry, I couldn't process your question. Please try asking something else about the biodiversity in Islamabad.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: inputValue,
        timestamp: new Date(),
      },
    ]);
    
    // Send question to API
    askMutation.mutate(inputValue);
    
    // Clear input
    setInputValue('');
  };

  // Handle suggested question click
  const handleSuggestedQuestionClick = (question: string) => {
    setInputValue(question);
    
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      },
    ]);
    
    // Send question to API
    askMutation.mutate(question);
  };

  // Fetch chat history
  const { data: chatHistory } = useQuery({
    queryKey: ['/api/rag/history'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch('/api/rag/history', {
        headers: {
          'Authorization': user.id,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Render message component
  const renderMessage = (message: Message) => {
    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 p-4 rounded-lg',
          message.role === 'user' ? 'bg-primary-light/10 ml-12' : 'bg-bg-card mr-12'
        )}
      >
        {message.role !== 'user' && (
          <Avatar className="h-10 w-10">
            <AvatarImage src="/assets/bot-avatar.png" />
            <AvatarFallback className="bg-primary text-white">
              <Bird className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1">
          <div className="text-sm font-medium mb-1">
            {message.role === 'user' ? 'You' : 'BioScout'}
          </div>
          
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <BookOpen className="h-3 w-3 mr-1" />
                Sources:
              </div>
              <div className="flex flex-wrap gap-1">
                {message.sources.map((source, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {message.related_species && message.related_species.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <Leaf className="h-3 w-3 mr-1" />
                Related Species:
              </div>
              <div className="flex flex-wrap gap-1">
                {message.related_species.map((species) => (
                  <span
                    key={species.id}
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      species.type === 'plant' ? 'bg-green-100 text-green-700' :
                      species.type === 'animal' ? 'bg-amber-100 text-amber-700' : 
                      species.type === 'fungi' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    )}
                  >
                    {species.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-400 mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {message.role === 'user' && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || ''} />
            <AvatarFallback className="bg-secondary text-white">
              {(user?.username?.[0] || 'U').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 handwritten">Ask About Biodiversity</h1>
        <p className="text-lg text-gray-600 mb-6">
          Ask questions about plants, animals, and ecosystems in Islamabad. 
          Our AI-powered guide provides accurate, locally-relevant information.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main chat area */}
        <div className="md:col-span-8">
          <Card className="wildlife-decoration leaf h-full flex flex-col">
            <CardHeader>
              <CardTitle>Biodiversity Conversations</CardTitle>
              <CardDescription>
                Ask about species, habitats, and conservation in Islamabad
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
                
                {/* Loading indicator */}
                {askMutation.isPending && (
                  <div className="flex items-center justify-center p-4">
                    <div className="wildlife-icons plant loading-sketch"></div>
                    <span className="ml-2">Searching knowledge base...</span>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about species, habitats, or ecology in Islamabad..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-grow"
                  />
                  <Button type="submit" disabled={askMutation.isPending || !inputValue.trim()}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </div>
        
        {/* Sidebar with suggested questions and info */}
        <div className="md:col-span-4">
          <div className="space-y-6">
            {/* Suggested questions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Suggested Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2 text-sm"
                      onClick={() => handleSuggestedQuestionClick(question)}
                    >
                      <Search className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">About BioScout</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>
                  BioScout provides information about the biodiversity of Islamabad, 
                  drawing from a database of local observations and scientific knowledge.
                </p>
                <Separator className="my-3" />
                <p className="text-xs text-gray-500">
                  Our AI uses a combination of local observation data and verified scientific 
                  resources to give you accurate information about local species.
                </p>
              </CardContent>
            </Card>
            
            {/* Tips card */}
            <Alert variant="outline">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tips for better results</AlertTitle>
              <AlertDescription className="text-xs text-gray-600">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Ask about specific species found in Islamabad</li>
                  <li>Inquire about ecological relationships</li>
                  <li>Ask about conservation status and threats</li>
                  <li>Ask about seasonal patterns and migrations</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}