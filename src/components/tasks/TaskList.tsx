'use client';

import { useContext, useMemo } from 'react';
import { LeadsContext } from '@/context/LeadsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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


    const responsivenessClasses = {
        hot: 'border-l-green-500',
        warm: 'border-l-orange-500',
        cold: 'border-l-blue-500',
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

    return (
        <div className="space-y-2">
            {sortedTasks.map(task => {
                if (!task) return null;
                
                return (
                    <Link href={`/lead/${task.leadId}`} key={task.id} className="block group transition-all duration-200 ease-in-out active:scale-[0.98]">
                        <div className={cn(
                            "relative overflow-hidden cursor-pointer bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 ease-in-out active:border-primary/50 flex items-center justify-between p-2.5 rounded-lg border-l-[3px]",
                            responsivenessClasses[task.responsiveness]
                        )}>
                            <div className="pl-2 flex-grow flex items-baseline gap-2">
                                <p className="font-semibold text-foreground shrink-0">{task.leadName}</p>
                                <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    );
}
