'use client';

import React, { useState, useContext } from 'react';
import { Lead, Interaction, Task, LEAD_TRAITS_OPTIONS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { User, Phone, BookOpen, PlusCircle, Archive, Edit } from 'lucide-react';
import ScoreBadge from './ScoreBadge';
import InteractionForm from './InteractionForm';
import InteractionHistory from './InteractionHistory';
import { LeadsContext } from '@/context/LeadsContext';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';

type LeadDetailsProps = {
  lead: Lead;
  interactions: Interaction[];
  task?: Task;
};

export default function LeadDetails({ lead, interactions, task }: LeadDetailsProps) {
  const { completeTask, updateLeadDetails } = useContext(LeadsContext);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  const [note, setNote] = useState(lead.note);
  const [traits, setTraits] = useState(lead.traits);
  const [isNoteEditing, setIsNoteEditing] = useState(false);

  const isMobile = useIsMobile();

  const handleTaskComplete = (taskId: string) => {
    if (!lead) return;
    completeTask(taskId, lead.id, task?.description.includes('Day 7') ?? false, true);
  };
  
  const handleNoteSave = async () => {
    await updateLeadDetails(lead.id, { note });
    setIsNoteEditing(false);
  }

  const handleTraitToggle = async (trait: string) => {
    const newTraits = traits.includes(trait) ? traits.filter(t => t !== trait) : [...traits, trait];
    setTraits(newTraits);
    await updateLeadDetails(lead.id, { traits: newTraits });
  }

  const renderTraitsAndNotes = () => {
    const traitsContent = (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Traits</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            {LEAD_TRAITS_OPTIONS.map(trait => (
                 <div key={trait} className="flex items-center space-x-2">
                    <Checkbox 
                        id={trait} 
                        checked={traits.includes(trait)}
                        onCheckedChange={() => handleTraitToggle(trait)}
                    />
                    <label
                        htmlFor={trait}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                       {trait}
                    </label>
                 </div>
            ))}
        </CardContent>
      </Card>
    );

    const notesContent = (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Notes</CardTitle>
          {!isNoteEditing && <Button variant="ghost" size="icon" onClick={() => setIsNoteEditing(true)}><Edit/></Button>}
        </CardHeader>
        <CardContent className="space-y-2">
           <Textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                readOnly={!isNoteEditing}
                className="h-32"
                placeholder="Add persistent notes about this lead..."
            />
            {isNoteEditing && (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => { setNote(lead.note); setIsNoteEditing(false);}}>Cancel</Button>
                    <Button onClick={handleNoteSave}>Save Note</Button>
                </div>
            )}
        </CardContent>
      </Card>
    );

    if (isMobile) {
      return (
        <Accordion type="multiple" className="w-full">
            <AccordionItem value="traits">
                <AccordionTrigger>Traits</AccordionTrigger>
                <AccordionContent>{traitsContent}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="notes">
                <AccordionTrigger>Notes</AccordionTrigger>
                <AccordionContent>{notesContent}</AccordionContent>
            </AccordionItem>
        </Accordion>
      )
    }

    return (
        <div className="grid md:grid-cols-2 gap-4">
            {traitsContent}
            {notesContent}
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 p-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              {lead.name}
              {lead.status === 'Archived' && <Badge variant="outline">Archived</Badge>}
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
                  Log Engagement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Engagement with {lead.name}</DialogTitle>
                  <DialogDescription>
                    This will override any pending tasks and generate a new score and task.
                  </DialogDescription>
                </DialogHeader>
                <InteractionForm lead={lead} setOpen={setIsLogInteractionOpen} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        {task && (
          <CardContent className="p-4 pt-0">
             <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Checkbox id="task" onCheckedChange={() => handleTaskComplete(task.id)} />
                    <label htmlFor='task' className='font-medium'>Pending Task: <span className='font-normal'>{task.description}</span></label>
                </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {renderTraitsAndNotes()}
      
      <InteractionHistory interactions={interactions} />
    </div>
  );
}
