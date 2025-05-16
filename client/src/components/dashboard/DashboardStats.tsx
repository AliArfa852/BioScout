import { useQuery } from "@tanstack/react-query";
import { ChevronUpIcon, ChevronDownIcon, UserIcon, CheckCircleIcon, ClipboardListIcon, ShieldIcon } from "lucide-react";

const DashboardStats = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
            <div className="h-14 bg-gray-200 rounded mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p className="text-red-600">Error loading dashboard statistics</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-neutral-500 text-sm">Active Onboarding</p>
            <p className="text-2xl font-semibold text-neutral-800">{stats.activeOnboarding}</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-full">
            <UserIcon className="h-6 w-6 text-primary-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-success-500 text-sm font-medium flex items-center">
            <ChevronUpIcon className="h-4 w-4 mr-1" />
            +3 since last month
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-neutral-500 text-sm">Training Completion</p>
            <p className="text-2xl font-semibold text-neutral-800">{stats.trainingCompletion}%</p>
          </div>
          <div className="bg-success-50 p-3 rounded-full">
            <CheckCircleIcon className="h-6 w-6 text-success-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-success-500 text-sm font-medium flex items-center">
            <ChevronUpIcon className="h-4 w-4 mr-1" />
            +5% improvement
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-neutral-500 text-sm">Open Tasks</p>
            <p className="text-2xl font-semibold text-neutral-800">{stats.openTasks}</p>
          </div>
          <div className="bg-warning-50 p-3 rounded-full">
            <ClipboardListIcon className="h-6 w-6 text-warning-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-danger-500 text-sm font-medium flex items-center">
            <ChevronDownIcon className="h-4 w-4 mr-1" />
            +8 since yesterday
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-neutral-500 text-sm">Compliance Score</p>
            <p className="text-2xl font-semibold text-neutral-800">{stats.complianceScore}%</p>
          </div>
          <div className="bg-primary-50 p-3 rounded-full">
            <ShieldIcon className="h-6 w-6 text-primary-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-success-500 text-sm font-medium flex items-center">
            <ChevronUpIcon className="h-4 w-4 mr-1" />
            +2% improvement
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
