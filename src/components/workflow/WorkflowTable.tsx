import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Workflow } from '@/types/workflow';
import { StatusBadge, WorkflowTypeBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkflowTableProps {
  workflows: Workflow[];
  className?: string;
}

export function WorkflowTable({ workflows, className }: WorkflowTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(workflows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, workflows.length);
  const currentWorkflows = workflows.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-x-hidden rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-[30%]">Employee</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-[15%]">Type</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-[15%]">Client</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-[20%]">Progress</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-[10%] text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-[10%]">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentWorkflows.map((workflow) => {
              const totalTasks = workflow.stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
              const completedTasks = workflow.stages.reduce(
                (acc, stage) => acc + stage.tasks.filter((t) => t.status === 'Done').length,
                0
              );
              const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              const dateLabel = workflow.type === 'Onboarding' ? 'START DATE' : 'END DATE';
              const date = workflow.type === 'Onboarding' 
                ? workflow.employee.startDate 
                : workflow.employee.endDate;

              return (
                <tr 
                  key={workflow.id} 
                  className="group hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                >
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-foreground text-sm leading-tight">{workflow.employee.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{workflow.employee.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <WorkflowTypeBadge type={workflow.type} />
                  </td>
                  <td className="px-6 py-2.5">
                    <span className="text-sm text-foreground font-medium">{workflow.client.name}</span>
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="max-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                        <span>{completedTasks} of {totalTasks}</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <ProgressBar value={completedTasks} max={totalTasks} size="sm" className="h-1.5" />
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex justify-center">
                      <StatusBadge status={workflow.status} />
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    {date && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{dateLabel}</span>
                        <span className="text-sm text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{endIndex}</span> of <span className="font-medium text-foreground">{workflows.length}</span> items
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-3 text-xs font-medium"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center mx-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-9 w-9 p-0 text-xs font-medium",
                  currentPage === page ? "bg-black text-white hover:bg-black/90" : "text-muted-foreground"
                )}
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-3 text-xs font-medium"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
