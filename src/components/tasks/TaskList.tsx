'use client';

import { useContext, useMemo } from 'react';
import { LeadsContext } from '@/context/LeadsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, User, Loader2, Calendar, Wrench, Wallet } from 'lucide-react';
import { isToday, isPast, formatDistanceToNowStrict } from 'date-fns';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface TaskListProps {
    tasks: Task[];
    title: string;
}

export default function TaskList({ tasks: initialTasks, title }: TaskListProps) {
    const { leads, getLeadResponsiveness, isLoading } = useContext(LeadsContext);

    const calculatedTasks = useMemo(() => {
        if (!leads.length) return [];
        return initialTasks.map(task => {
            const lead = leads.find(l => l.id === task.leadId);
            if (!lead || lead.status === 'Archived') return null;

            let dueDate: Date;
            if (task.dueDate instanceof Timestamp) {
                dueDate = task.dueDate.toDate();
            } else {
                dueDate = task.dueDate as Date;
            }
            
            return {
                ...task,
                leadName: lead.name,
                responsiveness: getLeadResponsiveness(lead.id),
                dueDate,
            }
        }).filter(Boolean);
    }, [initialTasks, leads, getLeadResponsiveness]);

    const sortedTasks = useMemo(() => {
        return calculatedTasks.sort((a, b) => {
            const aDate = a!.dueDate.getTime();
            const bDate = b!.dueDate.getTime();
            return aDate - bDate;
        });
    }, [calculatedTasks]);


    const getDueDateLabel = (task: typeof sortedTasks[0]) => {
        const dueDate = task!.dueDate;
        if (isPast(dueDate) && !isToday(dueDate)) return `Overdue by ${formatDistanceToNowStrict(dueDate)}`;
        if (isToday(dueDate)) return "Due Today";
        return `Due in ${formatDistanceToNowStrict(dueDate)}`;
    }

    const responsivenessClasses = {
        hot: 'before:bg-green-500 after:bg-green-500',
        warm: 'before:bg-orange-500 after:bg-orange-500',
        cold: 'before:bg-blue-500 after:bg-blue-500',
    };

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
                    <p className="text-muted-foreground text-sm">No tasks in this list.</p>
                </CardContent>
            </Card>
        )
    }

    const getTaskType = (description: string) => {
        if (description.toLowerCase().includes('follow up')) return 'Follow-up';
        if (description.toLowerCase().includes('close')) return 'Close';
        if (description.toLowerCase().includes('nurture')) return 'Nurture';
        return 'Action';
    }

    return (
        <div className="space-y-2.5">
            {sortedTasks.map(task => {
                if (!task) return null;
                const taskType = getTaskType(task.description);
                const isOverdue = isPast(task.dueDate) && !isToday(task.dueDate);

                return (
                    <Link href={`/lead/${task.leadId}`} key={task.id} className="block group transition-all duration-200 ease-in-out active:scale-[0.98]">
                        <div className={cn(
                            "relative overflow-hidden cursor-pointer bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 ease-in-out active:scale-[0.99] active:border-primary/50 flex items-center justify-between p-2.5 rounded-lg border",
                            "before:content-[''] before:absolute before:top-1 before:left-1 before:w-1 before:h-1 before:rounded-full after:content-[''] after:absolute after:bottom-1 after:left-1 after:w-1 after:h-1 after:rounded-full",
                            responsivenessClasses[task.responsiveness]
                        )}>
                            <div className="pl-4 flex-grow">
                                <p className="font-semibold text-foreground">{task.leadName}</p>
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="secondary" className="w-20 justify-center">{taskType}</Badge>
                                <Badge variant={isOverdue ? 'destructive' : 'outline'} className="w-28 hidden sm:flex justify-center text-center">
                                    {getDueDateLabel(task)}
                                </Badge>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    );
}
