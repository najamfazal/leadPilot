'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Lead } from '@/lib/types';
import { BookOpen, Calendar, Archive, Wrench, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadsContext } from '@/context/LeadsContext';
import { useContext, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import ScoreBadge from './ScoreBadge';

type LeadListItemProps = {
  lead: Lead;
};

export default function LeadListItem({ lead }: LeadListItemProps) {
  const { getLeadResponsiveness } = useContext(LeadsContext);
  const [isLoading, setIsLoading] = useState(false);
  const responsiveness = getLeadResponsiveness(lead.id);

  const responsivenessClasses = {
    hot: 'border-l-green-500',
    warm: 'border-l-orange-500',
    cold: 'border-l-blue-500',
  };
  
  const responsivenessProgressClasses = {
      hot: 'bg-green-500',
      warm: 'bg-orange-500',
      cold: 'bg-blue-500',
  }

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
    <Link 
      href={`/lead/${lead.id}`} 
      className="block group transition-all duration-200 ease-in-out active:scale-[0.98]"
      onClick={() => setIsLoading(true)}
    >
      <Card className={cn(
        "hover:shadow-md transition-shadow duration-200 ease-in-out hover:border-primary/20 relative overflow-hidden",
        "border-l-4",
        responsivenessClasses[responsiveness],
        lead.status === 'Archived' ? 'opacity-60 hover:opacity-100' : ''
      )}>
        <CardContent className="p-2.5">
          <div className="flex justify-between items-start gap-2">
             <div className="flex items-center gap-2 font-semibold">
                {getSegmentIcon()}
                {lead.name}
                {lead.status === 'Archived' && <Archive className="h-4 w-4 text-muted-foreground" />}
             </div>
             {lead.lastInteractionAt && (
              <div className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNowStrict(new Date(lead.lastInteractionAt as Date), { addSuffix: true })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>{lead.course}</span>
            </div>
            <ScoreBadge score={lead.score} />
          </div>
        </CardContent>
         {isLoading && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-muted-foreground/20">
                <div className={cn(
                    "h-full animate-indeterminate-progress",
                    responsivenessProgressClasses[responsiveness]
                )}></div>
            </div>
        )}
      </Card>
    </Link>
  );
}
