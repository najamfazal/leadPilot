'use client';

import { useContext, useMemo } from 'react';
import { LeadsContext } from '@/context/LeadsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClipboardCheck, User, Loader2, Calendar, Tool, AlertTriangle, Circle } from 'lucide-react';
import { formatDistanceToNow, isToday, isPast, format } from 'date-fns';
import { Badge } from '../ui/badge';
import ScoreBadge from '../leads/ScoreBadge';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskListProps {
    tasks: Task[];
}

export default function TaskList({ tasks: initialTasks }: TaskListProps) {
    const { leads, getLeadResponsiveness, isLoading, completeTask } = useContext(LeadsContext);

    const calculatedTasks = useMemo(() => {
        if (!leads.length) return [];
        return initialTasks.map(task => {
            const lead = leads.find(l => l.id === task.leadId);
            if (!lead || lead.status === 'Archived') return null;

            const responsiveness = getLeadResponsiveness(lead.id);
            let responsivenessValue = 0;
            if (responsiveness === 'hot') responsivenessValue = 30;
            if (responsiveness === 'warm') responsivenessValue = 15;

            let dueDate: Date;
            if (task.dueDate instanceof Timestamp) {
                dueDate = task.dueDate.toDate();
            } else {
                dueDate = task.dueDate;
            }
            
            const isDueToday = isToday(dueDate);
            const isOverdue = isPast(dueDate) && !isDueToday;
            const urgencyValue = isDueToday ? 50 : isOverdue ? 75 : 0;
            const priorityScore = lead.score + responsivenessValue + urgencyValue;

            return {
                ...task,
                leadName: lead.name,
                leadScore: lead.score,
                priorityScore,
                dueDate,
                isDueToday,
                isOverdue,
            }
        }).filter(Boolean);
    }, [initialTasks, leads, getLeadResponsiveness]);

    const sortedTasks = useMemo(() => {
        return calculatedTasks.sort((a, b) => b!.priorityScore - a!.priorityScore);
    }, [calculatedTasks]);

    const getPriorityIndicator = (score: number) => {
        if (score > 120) return { color: "text-red-500", label: "Very High" };
        if (score > 90) return { color: "text-orange-500", label: "High" };
        if (score > 60) return { color: "text-yellow-500", label: "Medium" };
        return { color: "text-gray-400", label: "Low" };
    }

    const getDueDateLabel = (task: typeof sortedTasks[0]) => {
        if (task!.isOverdue) return `Overdue by ${formatDistanceToNow(task!.dueDate)}`;
        if (task!.isDueToday) return "Due Today";
        return `Due in ${formatDistanceToNow(task!.dueDate)}`;
    }

    const handleCompleteTask = async (e: React.MouseEvent, taskId: string, leadId: string, description: string) => {
      e.preventDefault();
      e.stopPropagation();
      await completeTask(taskId, leadId, description.includes('Day 7'));
    }

    if (isLoading && sortedTasks.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (sortedTasks.length === 0) {
        return (
            <Card className="text-center py-8">
                <CardHeader className='p-4'>
                    <div className="mx-auto bg-secondary rounded-full p-2.5 w-fit">
                        <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-3 text-lg">All Tasks Completed!</CardTitle>
                </CardHeader>
                <CardContent className='p-4 pt-0'>
                    <p className="text-muted-foreground text-sm">Log a new interaction to generate the next task.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-2.5">
            {sortedTasks.map(task => {
                const priority = getPriorityIndicator(task!.priorityScore);
                const segmentIcon = () => {
                    switch (task?.segment) {
                        case 'Awaiting Event': return <Calendar className="h-4 w-4 text-primary" />;
                        case 'Action Required': return <Tool className="h-4 w-4 text-destructive" />;
                        case 'On Hold': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
                        case 'Needs Persuasion': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
                        default: return null;
                    }
                }

                return (
                <Link href={`/lead/${task!.leadId}`} key={task!.id} className="block group transition-all duration-200 ease-in-out active:scale-[0.98]">
                    <Card className="hover:border-primary/50 hover:shadow-md transition-all">
                        <CardContent className="p-3 flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                             <Button size="icon" variant="ghost" className='h-6 w-6' onClick={(e) => handleCompleteTask(e, task!.id, task!.leadId, task!.description)}>
                                <Circle className={cn("h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors", task!.completed && "text-green-500 fill-green-500/20")}/>
                             </Button>
                              <div className="flex-1 space-y-0.5">
                                  <p className="font-semibold text-foreground flex items-center gap-2">
                                    {segmentIcon()}
                                    {task!.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      <span>{task!.leadName}</span>
                                  </div>
                              </div>
                           </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Circle className={cn("h-2.5 w-2.5", priority.color)} />
                                    <span className={cn('hidden md:inline', priority.color)}>{priority.label}</span>
                                </div>
                                <Badge variant={task!.isOverdue ? 'destructive' : task!.isDueToday ? 'secondary' : 'outline'} className="text-xs w-[100px] justify-center text-center">
                                    {getDueDateLabel(task)}
                                </Badge>
                                <ScoreBadge score={task!.leadScore} />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )})}
        </div>
    );
}
