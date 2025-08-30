import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lead } from '@/lib/types';
import ScoreBadge from './ScoreBadge';
import { ArrowRight, BookOpen, User } from 'lucide-react';

type LeadListItemProps = {
  lead: Lead;
};

export default function LeadListItem({ lead }: LeadListItemProps) {
  return (
    <Link href={`/lead/${lead.id}`} className="block group">
      <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">{lead.name}</CardTitle>
            <ScoreBadge score={lead.score} />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center text-muted-foreground">
          <div className='flex gap-4'>
            <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{lead.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" />
                <span>{lead.course}</span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardContent>
      </Card>
    </Link>
  );
}
