import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lead, Interaction } from '@/lib/types';
import ScoreBadge from './ScoreBadge';
import { ArrowRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInHours } from 'date-fns';
import { Badge } from '../ui/badge';

type LeadListItemProps = {
  lead: Lead;
  lastInteraction?: Interaction;
};

export default function LeadListItem({ lead, lastInteraction }: LeadListItemProps) {

  const getResponsiveness = () => {
    if (!lastInteraction) return 'cold';
    const hours = differenceInHours(new Date(), lastInteraction.date);
    if (hours < 24) return 'hot';
    if (hours < 72) return 'warm';
    return 'cold';
  };

  const responsiveness = getResponsiveness();

  const responsivenessClasses = {
    hot: 'bg-red-500/10 border-red-500/20 hover:border-red-500/50',
    warm: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50',
    cold: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50',
  };

  return (
    <Link href={`/lead/${lead.id}`} className="block group">
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300",
        responsivenessClasses[responsiveness]
      )}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">{lead.name}</CardTitle>
            <ScoreBadge score={lead.score} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" />
                <span className='font-semibold text-accent'>{lead.course}</span>
            </div>
            <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {lastInteraction && lastInteraction.traits.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lastInteraction.traits.map(trait => (
                <Badge key={trait} variant="secondary" className="text-xs">{trait}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
