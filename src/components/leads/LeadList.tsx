'use client';

import { useContext } from 'react';
import { LeadsContext } from '@/context/LeadsContext';
import LeadListItem from './LeadListItem';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';

export default function LeadList() {
  const { leads } = useContext(LeadsContext);

  if (leads.length === 0) {
    return (
        <Card className="text-center py-12">
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">No Leads Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Click "Add New Lead" to start building your pipeline.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map(lead => (
        <LeadListItem key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
