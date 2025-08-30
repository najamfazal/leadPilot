'use client';

import { useState } from 'react';
import { Lead, Interaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { User, Phone, BookOpen, PlusCircle } from 'lucide-react';
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-3xl font-bold">{lead.name}</CardTitle>
            <CardDescription className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {lead.phone}
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {lead.course}
              </span>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-4">
            <ScoreBadge score={lead.score} />
            <Dialog open={isLogInteractionOpen} onOpenChange={setIsLogInteractionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Log New Interaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
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
