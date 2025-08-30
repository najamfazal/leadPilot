'use client';

import { Lead } from '@/lib/types';
import LeadListItem from './LeadListItem';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';

interface LeadListProps {
  leads: Lead[];
}

export default function LeadList({ leads }: LeadListProps) {
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

  // Sorting is now handled in the context to ensure it's based on the latest interaction
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {leads.map(lead => <LeadListItem key={lead.id} lead={lead} />)}
    </div>
  );
}
