'use client';

import { useState } from 'react';
import { Lead, Interaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { User, Phone, BookOpen, PlusCircle, Archive } from 'lucide-react';
import ScoreBadge from './ScoreBadge';
import InteractionForm from './InteractionForm';
import InteractionHistory from './InteractionHistory';

type LeadDetailsProps = {
  lead: Lead;
  interactions: Interaction[];
};

export default function LeadDetails({ lead, interactions }: LeadDetailsProps) {
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 p-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              {lead.name}
              {lead.status === 'Archived' && <Archive className="h-5 w-5 text-muted-foreground" />}
              </CardTitle>
            <CardDescription className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {lead.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {lead.course}
              </span>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-3">
            <ScoreBadge score={lead.score} />
            <Dialog open={isLogInteractionOpen} onOpenChange={setIsLogInteractionOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Log Interaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Interaction with {lead.name}</DialogTitle>
                  <DialogDescription>
                    Fill out the details below. The lead's score will be automatically updated.
                  </DialogDescription>
                </DialogHeader>
                <InteractionForm lead={lead} setOpen={setIsLogInteractionOpen} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>
      <InteractionHistory interactions={interactions} />
    </div>
  );
}
