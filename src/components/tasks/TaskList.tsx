'use client';

import { useContext, useMemo } from 'react';
import { LeadsContext } from '@/context/LeadsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, User } from 'lucide-react';
import { isToday } from 'date-fns';
import { Badge } from '../ui/badge';
import ScoreBadge from '../leads/ScoreBadge';
import Link from 'next/link';

export default function TaskList() {
    const { tasks, leads, getLeadResponsiveness } = useContext(LeadsContext);

    const calculatedTasks = useMemo(() => {
        return tasks.map(task => {
            const lead = leads.find(l => l.id === task.leadId);
            if (!lead) return null;

            const responsiveness = getLeadResponsiveness(lead.id);
            let responsivenessValue = 0;
            if (responsiveness === 'hot') responsivenessValue = 30;
            if (responsiveness === 'warm') responsivenessValue = 15;

            const urgencyValue = isToday(task.dueDate) ? 50 : 0;

            const priorityScore = lead.score + responsivenessValue + urgencyValue;

            return {
                ...task,
                leadName: lead.name,
                leadScore: lead.score,
                priorityScore,
            }
        }).filter(Boolean);
    }, [tasks, leads, getLeadResponsiveness]);

    const sortedTasks = useMemo(() => {
        return calculatedTasks.sort((a, b) => b!.priorityScore - a!.priorityScore);
    }, [calculatedTasks]);

    if (sortedTasks.length === 0) {
        return (
            <Card className="text-center py-12">
                <CardHeader>
                    <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                        <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">All Tasks Completed!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Log a new interaction to generate the next task.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {sortedTasks.map(task => (
                <Link href={`/lead/${task!.leadId}`} key={task!.id} className="block">
                    <Card className="hover:border-primary/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 space-y-1">
                                <p className="font-semibold text-foreground">{task!.description}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{task!.leadName}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {isToday(task!.dueDate) && <Badge variant="destructive">Due Today</Badge>}
                                <ScoreBadge score={task!.leadScore} />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
