import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy,
  Users,
  Calendar,
  User,
  Filter,
  TreePine,
  Leaf,
  Droplet,
  Camera,
  SunDim,
  PlanterPot,
  CircleSlashed,
  Award,
  ArrowUpRight,
  Globe,
  Sparkles,
  CheckCircle,
  BadgeCheck,
  Clock
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  
  // Fetch leaderboard data
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/leaderboard', timeframe, category],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}&category=${category}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      return response.json();
    }
  });
  
  // Fetch eco rewards
  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['/api/leaderboard/eco-rewards'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/eco-rewards');
      if (!response.ok) {
        throw new Error('Failed to fetch eco rewards');
      }
      return response.json();
    }
  });
  
  // Fetch user rewards eligibility (only if user is logged in)
  const { data: eligibilityData, isLoading: eligibilityLoading } = useQuery({
    queryKey: ['/api/leaderboard/user-eligibility', user?.username],
    queryFn: async () => {
      if (!user?.username) return null;
      
      const response = await fetch(`/api/leaderboard/user/${user.username}/eligibility`);
      if (!response.ok) {
        throw new Error('Failed to fetch reward eligibility');
      }
      return response.json();
    },
    enabled: !!user?.username
  });
  
  // Fetch community stats
  const { data: communityStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/leaderboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch community stats');
      }
      return response.json();
    }
  });
  
  // Handle reward claim
  const handleClaimReward = async (rewardId: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to claim rewards.",
        variant: "destructive",
      });
      return;
    }
    
    setIsClaimingReward(true);
    
    try {
      const response = await fetch('/api/leaderboard/claim-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          reward_id: rewardId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to claim reward');
      }
      
      toast({
        title: "Reward Claimed!",
        description: data.message,
        variant: "default",
      });
      
      // Refresh eligibility data
      // queryClient.invalidateQueries(['/api/leaderboard/user-eligibility']);
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClaimingReward(false);
      setSelectedReward(null);
    }
  };
  
  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'tree': return <TreePine className="h-5 w-5 text-green-600" />;
      case 'droplet': return <Droplet className="h-5 w-5 text-blue-600" />;
      case 'sun': return <SunDim className="h-5 w-5 text-yellow-600" />;
      case 'seedling': return <PlanterPot className="h-5 w-5 text-green-600" />;
      case 'bottle': return <Droplet className="h-5 w-5 text-cyan-600" />;
      case 'camera': return <Camera className="h-5 w-5 text-indigo-600" />;
      default: return <Award className="h-5 w-5 text-amber-600" />;
    }
  };
  
  const getUserInitials = (username: string) => {
    if (!username) return '??';
    const parts = username.split(/[_\s.-]/);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 handwritten">Community Contribution Leaderboard</h1>
        <p className="text-lg text-gray-600">
          Track conservation contributions and earn eco-friendly rewards for your participation.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="leaderboard">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                <span>Eco Rewards</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Community Contributors</CardTitle>
                      <CardDescription>
                        Top contributors making a difference in biodiversity research
                      </CardDescription>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Select 
                        value={timeframe} 
                        onValueChange={setTimeframe}
                      >
                        <SelectTrigger className="w-[130px]">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="year">Past Year</SelectItem>
                          <SelectItem value="month">Past Month</SelectItem>
                          <SelectItem value="week">Past Week</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={category} 
                        onValueChange={setCategory}
                      >
                        <SelectTrigger className="w-[130px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Species</SelectItem>
                          <SelectItem value="plant">Plants</SelectItem>
                          <SelectItem value="animal">Animals</SelectItem>
                          <SelectItem value="fungi">Fungi</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {leaderboardLoading ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
                        <>
                          {/* Top 3 podium */}
                          <div className="grid grid-cols-3 gap-2 mb-8 mt-4">
                            {/* 2nd place */}
                            {leaderboardData.leaderboard.length > 1 && (
                              <div className="flex flex-col items-center order-1">
                                <div className="relative mb-2">
                                  <Avatar className="h-20 w-20 border-2 border-silver">
                                    <AvatarImage src={leaderboardData.leaderboard[1].profile_image_url} />
                                    <AvatarFallback className="bg-gray-200 text-gray-700">
                                      {getUserInitials(leaderboardData.leaderboard[1].username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-2 -right-2 bg-silver text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white">
                                    2
                                  </div>
                                </div>
                                <div className="text-center mt-1">
                                  <div className="font-semibold">{leaderboardData.leaderboard[1].username}</div>
                                  <div className="text-sm text-gray-600">{leaderboardData.leaderboard[1].total_points} pts</div>
                                </div>
                                <div className="h-20 w-full bg-silver/20 mt-2 rounded-md flex items-end justify-center">
                                  <div className="h-3/4 w-full bg-silver rounded-md"></div>
                                </div>
                              </div>
                            )}
                            
                            {/* 1st place */}
                            {leaderboardData.leaderboard.length > 0 && (
                              <div className="flex flex-col items-center order-2">
                                <div className="relative mb-2">
                                  <Avatar className="h-24 w-24 border-2 border-amber-500">
                                    <AvatarImage src={leaderboardData.leaderboard[0].profile_image_url} />
                                    <AvatarFallback className="bg-amber-100 text-amber-800">
                                      {getUserInitials(leaderboardData.leaderboard[0].username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white">
                                    1
                                  </div>
                                </div>
                                <div className="text-center mt-1">
                                  <div className="font-semibold">{leaderboardData.leaderboard[0].username}</div>
                                  <div className="text-sm text-gray-600">{leaderboardData.leaderboard[0].total_points} pts</div>
                                </div>
                                <div className="h-28 w-full bg-amber-100 mt-2 rounded-md flex items-end justify-center">
                                  <div className="h-5/6 w-full bg-amber-500 rounded-md"></div>
                                </div>
                              </div>
                            )}
                            
                            {/* 3rd place */}
                            {leaderboardData.leaderboard.length > 2 && (
                              <div className="flex flex-col items-center order-3">
                                <div className="relative mb-2">
                                  <Avatar className="h-16 w-16 border-2 border-amber-700">
                                    <AvatarImage src={leaderboardData.leaderboard[2].profile_image_url} />
                                    <AvatarFallback className="bg-amber-100 text-amber-800">
                                      {getUserInitials(leaderboardData.leaderboard[2].username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold border-2 border-white">
                                    3
                                  </div>
                                </div>
                                <div className="text-center mt-1">
                                  <div className="font-semibold">{leaderboardData.leaderboard[2].username}</div>
                                  <div className="text-sm text-gray-600">{leaderboardData.leaderboard[2].total_points} pts</div>
                                </div>
                                <div className="h-16 w-full bg-amber-700/20 mt-2 rounded-md flex items-end justify-center">
                                  <div className="h-2/3 w-full bg-amber-700 rounded-md"></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Rest of the leaderboard */}
                          <div className="space-y-2">
                            {leaderboardData.leaderboard.slice(3).map((entry: any, index: number) => (
                              <div 
                                key={entry.username}
                                className={cn(
                                  "flex items-center p-3 rounded-lg",
                                  user?.username === entry.username ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
                                )}
                              >
                                <div className="flex-shrink-0 w-8 text-center font-semibold text-gray-500">
                                  {index + 4}
                                </div>
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage src={entry.profile_image_url} />
                                  <AvatarFallback>{getUserInitials(entry.username)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                  <div className="flex flex-col sm:flex-row sm:justify-between">
                                    <div className="font-medium">{entry.username}</div>
                                    <div className="flex items-center mt-1 sm:mt-0">
                                      <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                                      <span className="font-semibold">{entry.total_points} points</span>
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center">
                                      <Users className="h-3 w-3 mr-1" />
                                      {entry.observation_count} observations
                                    </span>
                                    <span className="inline-flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {entry.verified_count} verified
                                    </span>
                                    <span className="inline-flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Last: {new Date(entry.latest_observation).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Eco impact */}
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <div className="ml-2 p-1.5 bg-green-100 rounded-full cursor-help">
                                      <Globe className="h-5 w-5 text-green-600" />
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="flex justify-between space-x-4">
                                      <div className="space-y-1">
                                        <h4 className="text-sm font-semibold">Environmental Impact</h4>
                                        <div className="text-sm">
                                          <div className="flex items-center mt-2">
                                            <TreePine className="h-4 w-4 mr-2 text-green-600" />
                                            <span>~{(entry.eco_impact).toFixed(1)}kg CO₂ offset</span>
                                          </div>
                                          <div className="mt-2 text-xs text-gray-500">
                                            Based on species documentation, habitat preservation contributions, and eco-rewards claimed.
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="py-12 text-center">
                          <CircleSlashed className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500">No leaderboard data available for the selected filters.</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => {
                              setTimeframe('all');
                              setCategory('all');
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Eco Rewards Tab */}
            <TabsContent value="rewards">
              <Card>
                <CardHeader>
                  <CardTitle>Eco-Friendly Rewards</CardTitle>
                  <CardDescription>
                    Earn points by contributing observations and claim eco-friendly rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rewardsLoading ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rewardsData?.rewards?.map((reward: any) => {
                          const userHasPoints = eligibilityData?.rewards?.find((r: any) => r.id === reward.id)?.eligible;
                          const progress = eligibilityData?.rewards?.find((r: any) => r.id === reward.id)?.progress || 0;
                          const isClaimed = eligibilityData?.claimed_rewards?.includes(reward.id);
                          
                          return (
                            <Card 
                              key={reward.id}
                              className={cn(
                                "border overflow-hidden",
                                isClaimed && "bg-green-50 border-green-200",
                                !isClaimed && userHasPoints && "bg-blue-50 border-blue-200"
                              )}
                            >
                              <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    {getRewardIcon(reward.icon)}
                                    <CardTitle className="ml-2 text-lg">{reward.name}</CardTitle>
                                  </div>
                                  <Badge variant={reward.category === 'conservation' ? 'default' : 'outline'}>
                                    {reward.category}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                                
                                <div className="flex flex-col space-y-1 mb-4">
                                  <div className="flex justify-between text-xs">
                                    <span>Points Required</span>
                                    <span className="font-semibold">{reward.points_required}</span>
                                  </div>
                                  
                                  {user ? (
                                    <Progress value={progress} className="h-2" />
                                  ) : (
                                    <Progress value={0} className="h-2" />
                                  )}
                                </div>
                                
                                <div className="rounded-md bg-gray-100 p-2 text-xs text-gray-700 flex items-start">
                                  <Globe className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                                  <span>{reward.impact}</span>
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                {user ? (
                                  isClaimed ? (
                                    <Button className="w-full" variant="outline" disabled>
                                      <BadgeCheck className="h-4 w-4 mr-2 text-green-600" />
                                      Claimed
                                    </Button>
                                  ) : (
                                    <Button 
                                      className="w-full" 
                                      disabled={!userHasPoints || isClaimingReward}
                                      onClick={() => setSelectedReward(reward)}
                                    >
                                      {userHasPoints ? (
                                        <>
                                          <Award className="h-4 w-4 mr-2" />
                                          Claim Reward
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="h-4 w-4 mr-2" />
                                          {eligibilityData?.points 
                                            ? `${eligibilityData.points}/${reward.points_required} Points` 
                                            : 'Insufficient Points'}
                                        </>
                                      )}
                                    </Button>
                                  )
                                ) : (
                                  <Button className="w-full" variant="outline" disabled>
                                    <User className="h-4 w-4 mr-2" />
                                    Login to Claim
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Progress Card */}
          {user && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {eligibilityLoading ? (
                  <div className="py-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : eligibilityData ? (
                  <>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{eligibilityData.username}</div>
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center">
                            <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                            <span>{eligibilityData.points} points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <div className="text-sm font-medium">Environmental Impact</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-50 rounded-md p-2 flex flex-col items-center justify-center">
                          <TreePine className="h-5 w-5 text-green-600 mb-1" />
                          <div className="text-sm font-medium">{eligibilityData.eco_impact.trees_planted}</div>
                          <div className="text-xs text-gray-500">Trees Planted</div>
                        </div>
                        <div className="bg-blue-50 rounded-md p-2 flex flex-col items-center justify-center">
                          <Droplet className="h-5 w-5 text-blue-600 mb-1" />
                          <div className="text-sm font-medium">{eligibilityData.eco_impact.water_projects}</div>
                          <div className="text-xs text-gray-500">Water Projects</div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 text-green-600 mr-2" />
                          <div className="text-sm">CO₂ Offset</div>
                        </div>
                        <div className="text-sm font-medium">{eligibilityData.eco_impact.co2_reduced} kg</div>
                      </div>
                    </div>
                    
                    {/* Next available reward */}
                    {eligibilityData.rewards && (
                      <div className="pt-2">
                        <div className="text-sm font-medium mb-2">Next Available Reward</div>
                        {eligibilityData.rewards
                          .filter((r: any) => !eligibilityData.claimed_rewards.includes(r.id))
                          .sort((a: any, b: any) => a.points_required - b.points_required)
                          .slice(0, 1)
                          .map((reward: any) => (
                            <div key={reward.id} className="border rounded-md p-3 bg-gray-50">
                              <div className="flex items-center mb-2">
                                {getRewardIcon(reward.icon)}
                                <div className="ml-2 font-medium">{reward.name}</div>
                              </div>
                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{eligibilityData.points}/{reward.points_required} points</span>
                                  <span className="font-medium">{reward.progress}%</span>
                                </div>
                                <Progress value={reward.progress} className="h-2" />
                              </div>
                              <div className="text-xs text-gray-500">
                                {reward.eligible ? 
                                  "You have enough points to claim this reward!" : 
                                  `You need ${reward.points_required - eligibilityData.points} more points`}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    Error loading user data
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Community Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Community Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="py-4 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : communityStatsData?.stats ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-md p-3 text-center">
                      <div className="text-2xl font-bold">
                        {communityStatsData.stats.total_observations.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Observations</div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 text-center">
                      <div className="text-2xl font-bold">
                        {communityStatsData.stats.total_species.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Species Recorded</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-md p-3">
                    <div className="text-sm font-medium mb-2">Environmental Impact</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="flex justify-center mb-1">
                          <TreePine className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-sm font-medium">
                          {communityStatsData.stats.environmental_impact.trees_planted}
                        </div>
                        <div className="text-xs text-gray-500">Trees</div>
                      </div>
                      <div>
                        <div className="flex justify-center mb-1">
                          <Droplet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium">
                          {communityStatsData.stats.environmental_impact.water_projects}
                        </div>
                        <div className="text-xs text-gray-500">Water Projects</div>
                      </div>
                      <div>
                        <div className="flex justify-center mb-1">
                          <Globe className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-sm font-medium">
                          {communityStatsData.stats.environmental_impact.co2_reduced_kg}
                        </div>
                        <div className="text-xs text-gray-500">kg CO₂</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Species distribution */}
                  {communityStatsData.stats.type_distribution && (
                    <div>
                      <div className="text-sm font-medium mb-2">Species Types</div>
                      <div className="space-y-2">
                        {communityStatsData.stats.type_distribution.map((type: any) => {
                          const percentage = Math.round((type.count / communityStatsData.stats.total_observations) * 100);
                          return (
                            <div key={type.type} className="flex flex-col">
                              <div className="flex justify-between items-center mb-1">
                                <div className="text-sm capitalize flex items-center">
                                  <div className={cn(
                                    "w-3 h-3 rounded-full mr-2",
                                    type.type === 'plant' ? 'bg-green-500' :
                                    type.type === 'animal' ? 'bg-amber-500' :
                                    type.type === 'fungi' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  )} />
                                  {type.type}
                                </div>
                                <div className="text-xs font-medium">{percentage}%</div>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No community statistics available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Reward claim dialog */}
      {selectedReward && (
        <Dialog open={!!selectedReward} onOpenChange={(isOpen) => !isOpen && setSelectedReward(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Eco-Friendly Reward</DialogTitle>
              <DialogDescription>
                You're about to claim the following eco-friendly reward.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-gray-50 p-4 rounded-md flex items-start">
              <div className="mr-4">
                {getRewardIcon(selectedReward.icon)}
              </div>
              <div>
                <h3 className="font-semibold">{selectedReward.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedReward.description}</p>
                <div className="mt-2 text-sm flex items-center text-amber-600">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span>{selectedReward.points_required} points will be deducted</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <Globe className="h-5 w-5 mr-2 text-green-600" />
                <h4 className="font-medium">Environmental Impact</h4>
              </div>
              <p className="text-sm text-gray-700">{selectedReward.impact}</p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSelectedReward(null)}
                disabled={isClaimingReward}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleClaimReward(selectedReward.id)}
                disabled={isClaimingReward}
              >
                {isClaimingReward ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Confirm Claim
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}