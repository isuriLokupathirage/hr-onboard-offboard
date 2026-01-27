import { ArrowRight } from 'lucide-react';
import { mockWorkflows, currentUser } from '@/data/mockData';
import { Task, Stage, Workflow } from '@/types/workflow';
import { TaskCard } from '@/components/workflow/TaskCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TaskWithContext {
  task: Task;
  workflow: Workflow;
  stage: Stage;
}

export function MyTasksList() {
  const navigate = useNavigate();

  // Get all tasks assigned to the current user
  const myTasks: TaskWithContext[] = mockWorkflows.flatMap((workflow) =>
    workflow.stages.flatMap((stage) =>
      stage.tasks
        .filter(
          (task) =>
            task.assignedTo?.id === currentUser.id && task.status === 'Pending'
        )
        .map((task) => ({ task, workflow, stage }))
    )
  );

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">My Tasks</h3>
          <p className="text-sm text-muted-foreground">
            {myTasks.length} pending task{myTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-tasks')}>
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="divide-y divide-border">
        {myTasks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No pending tasks assigned to you</p>
          </div>
        ) : (
          myTasks.slice(0, 5).map(({ task, workflow, stage }) => (
            <div key={task.id} className="p-4">
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">
                  {workflow.employee.name} • {stage.name}
                </span>
              </div>
              <TaskCard task={task} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
