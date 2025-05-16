import { useQuery } from "@tanstack/react-query";
import { MoreHorizontalIcon, BookOpenIcon, ShieldIcon, UsersIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TrainingModules = () => {
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ["/api/training-modules"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-800">Training Modules</h2>
          <Button size="sm" className="px-3 py-1">Add New</Button>
        </div>
        <div className="p-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="ml-4 flex-1">
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full mr-3" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-800">Training Modules</h2>
        </div>
        <div className="p-5">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">Error loading training modules</p>
          </div>
        </div>
      </div>
    );
  }

  // Get icon based on module title (just for demo purposes)
  const getModuleIcon = (title: string) => {
    if (title.toLowerCase().includes('polic')) return BookOpenIcon;
    if (title.toLowerCase().includes('security') || title.toLowerCase().includes('cyber')) return ShieldIcon;
    if (title.toLowerCase().includes('team') || title.toLowerCase().includes('collab')) return UsersIcon;
    return FileTextIcon;
  };

  // Simulate completion data (would come from assignments in real data)
  const getModuleCompletion = (moduleId: number) => {
    const completions = {
      1: { percentage: 85, assigned: 12 },
      2: { percentage: 72, assigned: 24 },
      3: { percentage: 90, assigned: 8 },
      4: { percentage: 45, assigned: 5 },
    };
    return completions[moduleId as keyof typeof completions] || { percentage: 0, assigned: 0 };
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-800">Training Modules</h2>
        <Button size="sm" className="px-3 py-1 text-sm font-medium rounded text-white bg-primary-500 hover:bg-primary-600 transition duration-150 ease-in-out">
          Add New
        </Button>
      </div>
      <div className="p-5">
        {modules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">No training modules available</p>
          </div>
        ) : (
          modules.slice(0, 4).map((module) => {
            const ModuleIcon = getModuleIcon(module.title);
            const completion = getModuleCompletion(module.id);
            
            let statusColorClass = 'bg-danger-50 text-danger-700';
            if (completion.percentage >= 80) {
              statusColorClass = 'bg-success-50 text-success-700';
            } else if (completion.percentage >= 60) {
              statusColorClass = 'bg-warning-50 text-warning-700';
            }

            return (
              <div key={module.id} className="mb-4 last:mb-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-primary-50">
                      <ModuleIcon className="h-6 w-6 text-primary-500" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-neutral-800">{module.title}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Assigned to {completion.assigned} employees
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full mr-3 ${statusColorClass}`}>
                      {completion.percentage}% complete
                    </span>
                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
                      <MoreHorizontalIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all modules →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingModules;
