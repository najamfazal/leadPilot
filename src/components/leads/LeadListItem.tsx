'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lead, Interaction } from '@/lib/types';
import ScoreBadge from './ScoreBadge';
import { ArrowRight, BookOpen, Calendar, Archive, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInHours } from 'date-fns';
import { Badge } from '../ui/badge';
import { LeadsContext } from '@/context/LeadsContext';
import { useContext } from 'react';

type LeadListItemProps = {
  lead: Lead;
  lastInteraction?: Interaction;
};

export default function LeadListItem({ lead, lastInteraction }: LeadListItemProps) {
  const { getLeadResponsiveness } = useContext(LeadsContext);
  const responsiveness = getLeadResponsiveness(lead.id);

  const responsivenessClasses = {
    hot: 'border-l-4 border-green-500',
    warm: 'border-l-4 border-orange-500',
    cold: 'border-l-4 border-blue-500',
  };

  const getSegmentIcon = () => {
    switch (lead.segment) {
      case 'Awaiting Event':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'Action Required':
        return <Wrench className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  }

  return (
    <Link href={`/lead/${lead.id}`} className="block group transition-all duration-200 ease-in-out active:scale-[0.98]">
      <Card className={cn(
        "hover:shadow-md transition-shadow duration-200",
        responsivenessClasses[responsiveness],
        lead.status === 'Archived' ? 'opacity-60 hover:opacity-100' : ''
      )}>
        <CardHeader className="p-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {getSegmentIcon()}
              {lead.name}
              {lead.status === 'Archived' && <Archive className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
            <ScoreBadge score={lead.score} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-3 pt-0">
          <div className="flex justify-between items-center text-muted-foreground">
            <div className="flex items-center gap-2 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                <span className='font-semibold text-accent'>{lead.course}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {lastInteraction && lastInteraction.traits.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lastInteraction.traits.map(trait => (
                <Badge key={trait} variant="secondary" className="text-xs px-1.5 py-0.5">{trait}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
