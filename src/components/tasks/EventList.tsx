'use client';
import { Task } from '@/lib/types';
import { LeadsContext } from '@/context/LeadsContext';
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { isToday, isTomorrow, format, formatDistanceToNowStrict } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface EventListProps {
    events: Task[];
}

const getEventType = (description: string) => {
    if (description.toLowerCase().includes('demo')) return 'Demo';
    if (description.toLowerCase().includes('visit')) return 'Visit';
    if (description.toLowerCase().includes('meet')) return 'Online Meet';
    return 'Event';
}

const ProximityIndicator = ({ date }: { date: Date }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (!isToday(date)) return;
        const timer = setInterval(() => setNow(new Date()), 60 * 1000); // Update every minute
        return () => clearInterval(timer);
    }, [date]);

    if (!isToday(date) || date < now) return null;

    const distance = formatDistanceToNowStrict(date);
    const hours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));

    let color = 'text-amber-500';
    if (hours < 1) {
        color = 'text-red-500 font-semibold';
    }

    return <span className={cn('text-xs shrink-0', color)}>{`in ${distance}`}</span>;
};

export default function EventList({ events }: EventListProps) {
    const { leads, isLoading: isContextLoading } = useContext(LeadsContext);
    const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'tasks';

    const processedEvents = useMemo(() => {
        if (!leads.length) return [];
        return events
            .map(event => {
                const lead = leads.find(l => l.id === event.leadId);
                if (!lead) return null;
                return {
                    ...event,
                    leadName: lead.name,
                    eventType: getEventType(event.description),
                    dueDate: event.dueDate instanceof Timestamp ? event.dueDate.toDate() : (event.dueDate as Date),
                };
            })
            .filter(Boolean)
            .sort((a, b) => (a!.dueDate as Date).getTime() - (b!.dueDate as Date).getTime());
    }, [events, leads]);

    const groupedEvents = useMemo(() => {
        const today: typeof processedEvents = [];
        const tomorrow: typeof processedEvents = [];
        const later: typeof processedEvents = [];

        processedEvents.forEach(event => {
            if (!event) return;
            if (isToday(event.dueDate)) today.push(event);
            else if (isTomorrow(event.dueDate)) tomorrow.push(event);
            else later.push(event);
        });

        return { today, tomorrow, later };
    }, [processedEvents]);


    const renderEventPill = (event: NonNullable<typeof processedEvents[number]>) => (
         <Link 
            href={`/lead/${event.leadId}?from=${currentTab}`} 
            key={event.id} 
            className="block group transition-all duration-200 ease-in-out active:scale-[0.98]"
            onClick={() => setLoadingTaskId(event.id)}
        >
            <div className={cn(
                "relative overflow-hidden cursor-pointer bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 ease-in-out active:border-primary/50 flex items-center justify-between p-3 rounded-lg"
            )}>
                <div className="flex-grow flex items-baseline gap-3">
                    <p className="font-semibold text-foreground shrink-0">{event.leadName}</p>
                    <p className="text-sm text-muted-foreground truncate">{event.eventType}</p>
                </div>
                {isToday(event.dueDate) ? <ProximityIndicator date={event.dueDate} /> 
                    : !isTomorrow(event.dueDate) ? <span className="text-xs text-muted-foreground">{format(event.dueDate, 'EEE, MMM d')}</span>
                    : null
                }
                 {loadingTaskId === event.id && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-muted-foreground/20">
                        <div className="h-full animate-indeterminate-progress bg-primary"></div>
                    </div>
                )}
            </div>
        </Link>
    );

    const renderSection = (title: string, eventList: typeof processedEvents) => {
        if (eventList.length === 0) return null;
        return (
             <div className='space-y-3'>
                <h3 className="text-sm font-semibold text-muted-foreground px-1">{title}</h3>
                <div className="space-y-2">
                    {eventList.map(event => event && renderEventPill(event))}
                </div>
            </div>
        )
    }

     if (isContextLoading && processedEvents.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (processedEvents.length === 0) {
        return (
             <Card className="text-center py-8 bg-card/50">
                <CardHeader className='p-4'>
                    <div className="mx-auto bg-secondary rounded-full p-2.5 w-fit">
                        <CalendarCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-3 text-lg">No Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className='p-4 pt-0'>
                    <p className="text-muted-foreground text-sm">Schedule a demo or visit to see it here.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {renderSection('Today', groupedEvents.today)}
            {renderSection('Tomorrow', groupedEvents.tomorrow)}
            {renderSection('Later', groupedEvents.later)}
        </div>
    );
}
