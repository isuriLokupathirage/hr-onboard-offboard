import { useEffect, useState, useRef } from 'react';
import { TemplateTask } from '@/types/workflow';

interface DependencyArrowsProps {
  tasks: TemplateTask[];
  onRemoveDependency?: (sourceId: string, targetId: string) => void;
}

interface ArrowPath {
  id: string;
  sourceId: string;
  targetId: string;
  d: string;
  deleteButtonPos: { x: number; y: number };
}

export function DependencyArrows({ tasks, onRemoveDependency }: DependencyArrowsProps) {
  const [arrows, setArrows] = useState<ArrowPath[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const calculateArrows = () => {
      const newArrows: ArrowPath[] = [];
      const svgEl = svgRef.current;
      if (!svgEl) return;

      const containerEl = svgEl.parentElement;
      if (!containerEl) return;
      
      const containerRect = containerEl.getBoundingClientRect();

      tasks.forEach((task) => {
        if (!task.dependentOn || task.dependentOn.length === 0) return;

        const targetEl = document.getElementById(`task-card-${task.id}`);
        if (!targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();

        // Calculate Target Point (Left Center of the task card)
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2;
        const targetX = targetEl.offsetLeft; 

        task.dependentOn.forEach((depId) => {
          const sourceTask = tasks.find(t => t.id === depId);
          if (!sourceTask) return; 

          const sourceEl = document.getElementById(`task-card-${depId}`);
          if (!sourceEl) return;

          const sourceRect = sourceEl.getBoundingClientRect();
          const sourceY = sourceRect.top - containerRect.top + sourceRect.height / 2;
          const sourceX = sourceEl.offsetLeft;

          // Orthogonal Path Logic
          const minX = Math.min(sourceX, targetX);
          const busX = minX - 24; 

          const d = `
            M ${sourceX} ${sourceY}
            H ${busX}
            V ${targetY}
            H ${targetX}
          `;
          
          // Calculate delete button position (midpoint of the vertical segment)
          const midY = (sourceY + targetY) / 2;
          
          newArrows.push({
            id: `${depId}-${task.id}`,
            sourceId: depId,
            targetId: task.id,
            d,
            deleteButtonPos: { x: busX, y: midY }
          });
        });
      });

      setArrows(newArrows);
    };

    calculateArrows();
    window.addEventListener('resize', calculateArrows);
    
    const t1 = setTimeout(calculateArrows, 100);
    const t2 = setTimeout(calculateArrows, 300);
    const t3 = setTimeout(calculateArrows, 500);

    return () => {
      window.removeEventListener('resize', calculateArrows);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [tasks]);

  return (
    <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
        <marker
            id="dot"
            viewBox="0 0 10 10" 
            refX="5" 
            refY="5"
            markerWidth="5" 
            markerHeight="5"
        >
            <circle cx="5" cy="5" r="5" fill="#94a3b8" />
        </marker>
      </defs>
      {arrows.map((arrow) => (
        <g key={arrow.id} className="group">
            <path
              d={arrow.d}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              markerStart="url(#dot)"
              className="opacity-60 transition-all duration-300 ease-in-out group-hover:stroke-destructive group-hover:opacity-100"
            />
            
            {/* Clickable Area for easier interaction if needed, but button handles it */}
            
            <foreignObject
                x={arrow.deleteButtonPos.x - 10}
                y={arrow.deleteButtonPos.y - 10}
                width="20"
                height="20"
                className="overflow-visible pointer-events-auto"
            >
                <div 
                    className="w-5 h-5 bg-background border border-destructive/50 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-destructive hover:border-destructive transition-colors group-hover:scale-110"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onRemoveDependency) {
                            onRemoveDependency(arrow.sourceId, arrow.targetId);
                        }
                    }}
                    title="Remove dependency"
                >
                    <svg 
                        width="10" 
                        height="10" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-destructive w-3 h-3 hover:text-destructive-foreground"
                    >
                        <path d="M18 6 6 18" />
                        <path d="M6 6 18 18" />
                    </svg>
                </div>
            </foreignObject>
        </g>
      ))}
    </svg>
  );
}
