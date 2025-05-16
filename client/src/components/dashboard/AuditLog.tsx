import { useQuery } from "@tanstack/react-query";
import { FilterIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";

const AuditLog = () => {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ["/api/audit-logs/recent"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-800">Recent Audit Logs</h2>
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
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Resource</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-20" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-800">Recent Audit Logs</h2>
        </div>
        <div className="p-5">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">Error loading audit logs</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-800">Recent Audit Logs</h2>
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead>
              <tr>
                <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Resource</th>
                <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-neutral-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-700">{log.user}</div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">{log.action}</div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">{log.resource}</div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">{formatTime(log.timestamp)}</div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'success' 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-danger-100 text-danger-800'
                        }`}
                      >
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-center">
          <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all audit logs →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
