import { useQuery } from "@tanstack/react-query";
import { FilterIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

const OnboardingProgress = () => {
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ["/api/employees/onboarding"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-800">Active Onboarding Progress</h2>
          <div className="flex">
            <Button variant="ghost" size="icon" className="mr-2">
              <FilterIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontalIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mb-5 last:mb-0">
              <div className="flex items-center mb-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-800">Active Onboarding Progress</h2>
        </div>
        <div className="p-5">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">Error loading onboarding employees</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-800">Active Onboarding Progress</h2>
        <div className="flex">
          <Button variant="ghost" size="icon" className="mr-2">
            <FilterIcon className="h-5 w-5 text-neutral-500" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontalIcon className="h-5 w-5 text-neutral-500" />
          </Button>
        </div>
      </div>
      <div className="p-5">
        {employees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">No employees currently onboarding</p>
          </div>
        ) : (
          employees.map((employee) => (
            <div key={employee.id} className="mb-5 last:mb-0">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
                  {employee.profileImageUrl ? (
                    <img 
                      src={employee.profileImageUrl} 
                      alt={employee.name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-700 font-medium text-sm">
                      {employee.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <h3 className="font-medium text-neutral-800">{employee.name}</h3>
                    {employee.department && (
                      <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                        {employee.department}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">
                    Started {formatDistanceToNow(new Date(employee.startDate), { addSuffix: true })}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium text-neutral-700">{employee.progressPercentage}% complete</p>
                  <p className="text-xs text-neutral-500">{employee.remainingTasks} tasks remaining</p>
                </div>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2.5">
                <div 
                  className="bg-primary-500 h-2.5 rounded-full" 
                  style={{ width: `${employee.progressPercentage}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
        <div className="mt-6 text-center">
          <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all onboarding employees →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress;
