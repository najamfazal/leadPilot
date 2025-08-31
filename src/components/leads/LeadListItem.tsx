'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lead } from '@/lib/types';
import ScoreBadge from './ScoreBadge';
import { ArrowRight, BookOpen, Calendar, Archive, Wrench, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadsContext } from '@/context/LeadsContext';
import { useContext } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

type LeadListItemProps = {
  lead: Lead;
};

export default function LeadListItem({ lead }: LeadListItemProps) {
  const { getLeadResponsiveness } = useContext(LeadsContext);
  const responsiveness = getLeadResponsiveness(lead.id);

  const responsivenessClasses = {
    hot: 'border-l-[3px] border-green-500',
    warm: 'border-l-[3px] border-orange-500',
    cold: 'border-l-[3px] border-blue-500',
  };

  const getSegmentIcon = () => {
    switch (lead.segment) {
      case 'Awaiting Event':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'Action Required':
        return <Wrench className="h-4 w-4 text-destructive" />;
      case 'Needs Nurturing':
        return <Wallet className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  }

  return (
    <Link href={`/lead/${lead.id}`} className="block group transition-all duration-200 ease-in-out active:scale-[0.98]">
      <Card className={cn(
        "hover:shadow-md transition-shadow duration-200 ease-in-out hover:border-primary/40",
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
                <span className='font-semibold text-primary/80'>{lead.course}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {lead.lastInteractionAt && (
             <div className="flex items-center text-xs text-muted-foreground">
                 Last activity: {formatDistanceToNowStrict(new Date(lead.lastInteractionAt as Date), { addSuffix: true })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
