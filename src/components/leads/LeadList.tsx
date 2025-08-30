'use client';

import { useContext } from 'react';
import { LeadsContext } from '@/context/LeadsContext';
import LeadListItem from './LeadListItem';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';
import { Lead } from '@/lib/types';

interface LeadListProps {
  leads: Lead[];
}

export default function LeadList({ leads }: LeadListProps) {
  const { interactions } = useContext(LeadsContext);

  if (leads.length === 0) {
    return (
        <Card className="text-center py-8">
            <CardHeader className='p-4'>
                <div className="mx-auto bg-secondary rounded-full p-2.5 w-fit">
                    <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="mt-3 text-lg">No Leads Found</CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0'>
                <p className="text-muted-foreground text-sm">No leads match your criteria.</p>
            </CardContent>
        </Card>
    )
  }

  const sortedLeads = [...leads].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
      return dateB - dateA;
    }
    return 0;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {sortedLeads.map(lead => {
        const lastInteraction = interactions
          .filter(i => i.leadId === lead.id)
          .sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime())[0];
        return <LeadListItem key={lead.id} lead={lead} lastInteraction={lastInteraction} />
      })}
    </div>
  );
}
