'use client';

import React, { useState, useContext, useRef, useEffect } from 'react';
import { Lead, Interaction, Task, LEAD_TRAITS_OPTIONS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, X, Plus, Trash2 } from 'lucide-react';
import ScoreBadge from './ScoreBadge';
import InteractionForm from './InteractionForm';
import InteractionHistory from './InteractionHistory';
import { LeadsContext } from '@/context/LeadsContext';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

type LeadDetailsProps = {
  lead: Lead;
  interactions: Interaction[];
  task?: Task;
};

export default function LeadDetails({ lead, interactions, task }: LeadDetailsProps) {
  const { completeTask, updateLeadDetails } = useContext(LeadsContext);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);
  
  const [traits, setTraits] = useState(lead.traits);
  const [insights, setInsights] = useState(lead.insights || []);
  
  const [isTraitPopoverOpen, setIsTraitPopoverOpen] = useState(false);
  const [traitSearch, setTraitSearch] = useState('');
  
  const [newInsight, setNewInsight] = useState('');

  const handleTaskComplete = (taskId: string) => {
    if (!lead) return;
    completeTask(taskId, lead.id, task?.description.includes('Day 7') ?? false, true);
  };
  
  const handleAddTrait = async (trait: string) => {
    if (!trait || traits.includes(trait)) {
      setTraitSearch('');
      setIsTraitPopoverOpen(false);
      return;
    }
    const newTraits = [...traits, trait];
    setTraits(newTraits);
    await updateLeadDetails(lead.id, { traits: newTraits });
    setTraitSearch('');
    setIsTraitPopoverOpen(false);
  }

  const handleRemoveTrait = async (traitToRemove: string) => {
    const newTraits = traits.filter(t => t !== traitToRemove);
    setTraits(newTraits);
    await updateLeadDetails(lead.id, { traits: newTraits });
  }

  const handleAddInsight = async () => {
    if(!newInsight) return;
    const newInsights = [...insights, newInsight];
    setInsights(newInsights);
    await updateLeadDetails(lead.id, { insights: newInsights });
    setNewInsight('');
  }

  const handleRemoveInsight = async (indexToRemove: number) => {
    const newInsights = insights.filter((_, index) => index !== indexToRemove);
    setInsights(newInsights);
    await updateLeadDetails(lead.id, { insights: newInsights });
  }

  const availableTraits = LEAD_TRAITS_OPTIONS.filter(option => !traits.includes(option) && option.toLowerCase().includes(traitSearch.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 p-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              {lead.name}
            </CardTitle>
            <CardDescription className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                {lead.phone}
              </span>
              <span className="flex items-center gap-1.5">
                {lead.course}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-start gap-2">
            <Dialog open={isLogInteractionOpen} onOpenChange={setIsLogInteractionOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Log
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
            <ScoreBadge score={lead.score} />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
           <div className="flex flex-wrap items-center gap-2">
            {traits.map(trait => (
                <Badge key={trait} variant="secondary" className="group relative pr-7 text-sm">
                    {trait}
                    <button onClick={() => handleRemoveTrait(trait)} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-muted-foreground/20">
                        <X className="h-3.5 w-3.5"/>
                    </button>
                </Badge>
            ))}
             <Popover open={isTraitPopoverOpen} onOpenChange={setIsTraitPopoverOpen}>
                <PopoverTrigger asChild>
                     <Button variant="outline" size="icon" className="h-7 w-7 rounded-full">
                        <Plus className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1">
                    <div className="p-1">
                      <Input 
                        placeholder="Add trait..."
                        className="h-8"
                        value={traitSearch}
                        onChange={(e) => setTraitSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTrait(traitSearch);
                        }}
                      />
                    </div>
                    <div className="mt-1 max-h-48 overflow-y-auto">
                      {availableTraits.map(option => (
                        <Button key={option} variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleAddTrait(option)}>
                          {option}
                        </Button>
                      ))}
                      {traitSearch && !availableTraits.find(t => t.toLowerCase() === traitSearch.toLowerCase()) && (
                         <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleAddTrait(traitSearch)}>
                          <Plus className="mr-2 h-4 w-4"/> Create "{traitSearch}"
                        </Button>
                      )}
                    </div>
                </PopoverContent>
             </Popover>
           </div>
           
          {insights.length > 0 && (
            <p className="text-sm text-muted-foreground italic">
              {insights.join(' ')}
            </p>
          )}
          
        </CardContent>
      </Card>

      {task && (
          <Card>
            <CardContent className="p-3">
              <div className="bg-secondary p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Checkbox id="task" onCheckedChange={() => handleTaskComplete(task.id)} />
                      <label htmlFor='task' className='font-medium'>Pending Task: <span className='font-normal'>{task.description}</span></label>
                  </div>
              </div>
            </CardContent>
          </Card>
      )}

      <InteractionHistory interactions={interactions} />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manage Insights</CardTitle>
          <CardDescription>Add or remove short insights about the lead.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Add a new insight..."
              value={newInsight}
              onChange={(e) => setNewInsight(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddInsight();
              }}
            />
            <Button onClick={handleAddInsight}>Add</Button>
          </div>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md bg-secondary text-secondary-foreground text-sm">
                <p>{insight}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveInsight(index)}>
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
