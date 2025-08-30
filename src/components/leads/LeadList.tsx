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
        <Card className="text-center py-12">
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">No Leads Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No leads match your search, or you haven't added any yet.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map(lead => {
        const lastInteraction = interactions
          .filter(i => i.leadId === lead.id)
          .sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime())[0];
        return <LeadListItem key={lead.id} lead={lead} lastInteraction={lastInteraction} />
      })}
    </div>
  );
}
