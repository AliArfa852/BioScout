import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Users,
  Trophy,
  Medal,
  Leaf,
  Award,
  Calendar,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import '../styles/wildlife-theme.css';

// Define types
interface LeaderboardEntry {
  _id: string;
  username: string;
  profile_picture?: string;
  observations_count: number;
  verified_count: number;
  points: number;
  unique_species_count: number;
  latest_observation: string;
}

interface RewardTier {
  tier: number;
  name: string;
  points_required: number;
  description: string;
  eco_impact: string;
  digital_badge: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  completed?: boolean;
}

export default function LeaderboardPage() {
  const [timePeriod, setTimePeriod] = useState<string>('all-time');
  const [viewMode, setViewMode] = useState<string>('leaderboard');
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch leaderboard data
  const { data: leaderboardData, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['/api/leaderboard', timePeriod],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?period=${timePeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      return response.json();
    }
  });
  
  // Fetch reward tiers
  const { data: rewardTiers, isLoading: loadingRewards } = useQuery({
    queryKey: ['/api/leaderboard/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/rewards');
      if (!response.ok) {
        throw new Error('Failed to fetch reward tiers');
      }
      return response.json();
    }
  });
  
  // Fetch achievements
  const { data: achievements, isLoading: loadingAchievements } = useQuery({
    queryKey: ['/api/leaderboard/achievements'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers['Authorization'] = user.id;
      }
      
      const response = await fetch('/api/leaderboard/achievements', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      return response.json();
    },
    enabled: !!user
  });
  
  // Fetch user stats if logged in
  const { data: userStats, isLoading: loadingUserStats } = useQuery({
    queryKey: ['/api/leaderboard/user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const response = await fetch(`/api/leaderboard/user-stats/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return response.json();
    },
    enabled: !!user?.id
  });
  
  // Handle time period change
  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value);
  };
  
  // Get medal emoji for top 3 positions
  const getMedalEmoji = (position: number): React.ReactNode => {
    switch (position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-gray-500 font-mono">{position + 1}</span>;
    }
  };
  
  // Render the leaderboard tab
  const renderLeaderboard = () => {
    if (loadingLeaderboard) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="wildlife-icons plant loading-sketch"></div>
          <span className="ml-2">Loading leaderboard data...</span>
        </div>
      );
    }
    
    if (!leaderboardData || !leaderboardData.leaderboard || leaderboardData.leaderboard.length === 0) {
      return (
        <Alert className="my-6">
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There are no contributions yet for this time period. Be the first to contribute!
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Top Contributors</CardTitle>
            <Select value={timePeriod} onValueChange={handleTimePeriodChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Community members contributing the most to biodiversity mapping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Observations</TableHead>
                <TableHead className="text-right">Species</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.leaderboard.map((entry: LeaderboardEntry, index: number) => (
                <TableRow key={entry._id} className={cn(
                  entry._id === user?.id ? "bg-primary-light/10" : "",
                  index < 3 ? "font-medium" : ""
                )}>
                  <TableCell className="text-center">
                    {getMedalEmoji(index)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={entry.profile_picture} />
                        <AvatarFallback className="bg-primary text-white">
                          {entry.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{entry.username}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{entry.observations_count}</TableCell>
                  <TableCell className="text-right">{entry.unique_species_count}</TableCell>
                  <TableCell className="text-right font-bold">{entry.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="pb-3 text-sm text-gray-500">
          Make observations and earn points to climb the leaderboard!
        </CardFooter>
      </Card>
    );
  };
  
  // Render the rewards tab
  const renderRewards = () => {
    if (loadingRewards) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="wildlife-icons plant loading-sketch"></div>
          <span className="ml-2">Loading rewards data...</span>
        </div>
      );
    }
    
    if (!rewardTiers || rewardTiers.length === 0) {
      return (
        <Alert className="my-6">
          <AlertTitle>No rewards available</AlertTitle>
          <AlertDescription>
            Reward information is currently unavailable. Please check back later.
          </AlertDescription>
        </Alert>
      );
    }
    
    // Determine user's current tier
    const userPoints = userStats?.current_points || 0;
    const userTier = rewardTiers.find((tier: RewardTier, index: number) => {
      const nextTier = rewardTiers[index + 1];
      return tier.points_required <= userPoints && 
        (!nextTier || nextTier.points_required > userPoints);
    }) || rewardTiers[0];
    
    // Find next tier
    const userTierIndex = rewardTiers.findIndex((tier: RewardTier) => tier.tier === userTier.tier);
    const nextTier = userTierIndex < rewardTiers.length - 1 ? rewardTiers[userTierIndex + 1] : null;
    
    // Calculate progress to next tier
    const progressPercentage = nextTier 
      ? Math.min(100, ((userPoints - userTier.points_required) / 
        (nextTier.points_required - userTier.points_required)) * 100)
      : 100;
    
    return (
      <div className="space-y-6">
        {user && (
          <Card className="wildlife-decoration leaf">
            <CardHeader>
              <CardTitle>Your Eco-Reward Status</CardTitle>
              <CardDescription>
                Your contributions are making a real environmental impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary mb-1">{userTier?.name || 'Seedling'}</div>
                  <div className="text-sm text-gray-500 mb-4">{userTier?.description}</div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current: {userPoints} points</span>
                      {nextTier && (
                        <span>Next: {nextTier.points_required} points</span>
                      )}
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  
                  <div className="p-4 border rounded-md bg-green-50 border-green-200">
                    <div className="flex items-start mb-2">
                      <Leaf className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <div className="font-medium">Your Environmental Impact:</div>
                        <p className="text-gray-700">{userTier?.eco_impact}</p>
                      </div>
                    </div>
                    
                    {nextTier && (
                      <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-green-200">
                        <span className="font-medium">Next tier: </span>
                        <span>{nextTier.eco_impact}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="lg:w-1/3 flex flex-col items-center justify-center p-4 bg-green-50 rounded-md">
                  <div className="text-center mb-3">
                    <div className="text-sm text-gray-500 mb-1">Current Tier</div>
                    <div className="text-xl font-bold">{userTier?.name}</div>
                  </div>
                  
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                    <Sparkles className="h-16 w-16 text-primary" />
                  </div>
                  
                  {nextTier && (
                    <div className="text-sm">
                      <span className="text-gray-600">
                        {nextTier.points_required - userPoints} points to next tier
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewardTiers.map((tier: RewardTier) => (
            <Card 
              key={tier.tier}
              className={cn(
                userTier?.tier === tier.tier ? "border-primary border-2" : ""
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant={userTier?.tier === tier.tier ? "default" : "outline"}>
                    Tier {tier.tier}
                  </Badge>
                  {userTier?.tier === tier.tier && (
                    <Badge className="bg-green-500">Current</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-3">
                  <Award className="h-5 w-5 text-primary mr-2" />
                  <div className="font-semibold">{tier.points_required} points required</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-md text-sm">
                  <div className="font-medium mb-1">Environmental Impact:</div>
                  <div>{tier.eco_impact}</div>
                </div>
              </CardContent>
              <CardFooter>
                {user ? (
                  userTier?.tier >= tier.tier ? (
                    <div className="text-sm flex items-center text-green-600">
                      <Check className="w-4 h-4 mr-1" />
                      {userTier?.tier === tier.tier ? 'Current Tier' : 'Achieved'}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {tier.points_required - (userPoints || 0)} more points needed
                    </div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">
                    Login to track your progress
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  // Render the achievements tab
  const renderAchievements = () => {
    if (loadingAchievements) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="wildlife-icons plant loading-sketch"></div>
          <span className="ml-2">Loading achievements data...</span>
        </div>
      );
    }
    
    if (!achievements || achievements.length === 0) {
      return (
        <Alert className="my-6">
          <AlertTitle>No achievements available</AlertTitle>
          <AlertDescription>
            Achievement information is currently unavailable. Please check back later.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div>
        {!user && (
          <Alert className="mb-6">
            <AlertTitle>Login to track achievements</AlertTitle>
            <AlertDescription>
              Sign in to track your personal achievements and earn bonus points!
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement: Achievement) => (
            <Card 
              key={achievement.id}
              className={cn(
                achievement.completed ? "border-green-400" : ""
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge 
                    variant={achievement.completed ? "default" : "outline"}
                    className={achievement.completed ? "bg-green-500" : ""}
                  >
                    {achievement.completed ? 'Completed' : 'Incomplete'}
                  </Badge>
                  <Badge variant="outline">+{achievement.points} pts</Badge>
                </div>
                <CardTitle className="text-lg">{achievement.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    achievement.completed ? "bg-green-100" : "bg-gray-100"
                  )}>
                    <Award className={cn(
                      "h-5 w-5",
                      achievement.completed ? "text-green-600" : "text-gray-500" 
                    )} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{achievement.description}</p>
                    
                    {user && achievement.completed && (
                      <div className="mt-2 flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 handwritten">Community Contribution Leaderboard</h1>
        <p className="text-lg text-gray-600 mb-6">
          Recognizing community members who are leading our biodiversity mapping efforts
          and the real environmental impact they're creating.
        </p>
      </div>
      
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            <span>Eco-Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboard">
          {renderLeaderboard()}
        </TabsContent>
        
        <TabsContent value="rewards">
          {renderRewards()}
        </TabsContent>
        
        <TabsContent value="achievements">
          {renderAchievements()}
        </TabsContent>
      </Tabs>
      
      {/* User Stats Card */}
      {user && userStats && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Contribution Statistics</CardTitle>
            <CardDescription>
              Your personal impact on mapping Islamabad's biodiversity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="border rounded-md p-4">
                <div className="text-sm text-gray-500 mb-1">Observations</div>
                <div className="text-2xl font-bold">{userStats.statistics.total_observations}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {userStats.statistics.verified_observations} verified
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="text-sm text-gray-500 mb-1">Species Documented</div>
                <div className="text-2xl font-bold">{userStats.statistics.unique_species_count}</div>
                <div className="text-xs text-gray-500 mt-1">Unique species observed</div>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="text-sm text-gray-500 mb-1">Total Points</div>
                <div className="text-2xl font-bold">{userStats.current_points}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Rank: {userStats.ranking.overall ? `#${userStats.ranking.overall}` : 'N/A'}
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="text-sm text-gray-500 mb-1">Weekly Rank</div>
                <div className="text-2xl font-bold">
                  {userStats.ranking.weekly ? `#${userStats.ranking.weekly}` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 mt-1">This week's position</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userStats.type_distribution && Object.keys(userStats.type_distribution).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Observation Types</h3>
                  <div className="space-y-2">
                    {Object.entries(userStats.type_distribution).map(([type, count]) => (
                      <div key={type} className="flex items-center">
                        <div className={cn(
                          "w-3 h-3 rounded-full mr-2",
                          type === 'plant' ? 'bg-green-500' :
                          type === 'animal' ? 'bg-amber-500' :
                          type === 'fungi' ? 'bg-red-500' :
                          'bg-blue-500'
                        )} />
                        <div className="flex-1">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div className="font-medium">{count as number}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-2">Activity Timeline</h3>
                {userStats.statistics.first_observation && (
                  <div className="text-sm space-y-3">
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <div>
                        <div className="font-medium">First Observation</div>
                        <div className="text-gray-500">
                          {new Date(userStats.statistics.first_observation).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {userStats.statistics.latest_observation && (
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <div className="font-medium">Latest Observation</div>
                          <div className="text-gray-500">
                            {new Date(userStats.statistics.latest_observation).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-gray-500">
            <Button asChild variant="link" className="p-0">
              <Link href="/identify">
                <span>Contribute more observations</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* How It Works */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>How to earn points and make a real environmental impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">Contribute Observations</h3>
              <p className="text-sm text-gray-600">
                Upload photos of local flora and fauna through the Identify section to earn points
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-primary-dark" />
              </div>
              <h3 className="font-medium mb-2">Earn Points & Achievements</h3>
              <p className="text-sm text-gray-600">
                Earn more for unique or rare species. Verified observations earn bonus points
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">Create Environmental Impact</h3>
              <p className="text-sm text-gray-600">
                As you reach higher tiers, we convert your digital contributions into real-world conservation efforts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}