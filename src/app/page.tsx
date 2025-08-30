'use client';
import { useState, useContext, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import AddLeadForm from '@/components/leads/AddLeadForm';
import LeadList from '@/components/leads/LeadList';
import Logo from '@/components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskList from '@/components/tasks/TaskList';
import { Input } from '@/components/ui/input';
import { LeadsContext } from '@/context/LeadsContext';
import { LeadSegment } from '@/lib/types';

export default function Home() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { leads, tasks, isLoading } = useContext(LeadsContext);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads.filter(lead => lead.status !== 'Archived');
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);
  
  const getLeadsBySegment = (segment: LeadSegment) => {
    return leads.filter(lead => lead.segment === segment);
  }

  const getActionRequiredTasks = () => {
    return tasks.filter(task => task.segment === 'Action Required');
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">ScoreCard CRM</h1>
          </div>
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter the details of the new lead. They will start with a score of 50.
                </DialogDescription>
              </DialogHeader>
              <AddLeadForm setOpen={setIsAddLeadOpen} />
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6">
          {isLoading && !leads.length ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="events">Upcoming Events</TabsTrigger>
                <TabsTrigger value="nurturing">Nurturing Queue</TabsTrigger>
                <TabsTrigger value="todos">My To-Dos</TabsTrigger>
              </TabsList>
              <TabsContent value="tasks" className="mt-4">
                <TaskList tasks={tasks.filter(t => !t.segment || t.segment === 'Standard Follow-up' || t.segment === 'Special Follow-up' || t.segment === 'On Hold' || t.segment === 'Needs Persuasion')} />
              </TabsContent>
              <TabsContent value="leads" className="mt-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by name (including archived)..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <LeadList leads={filteredLeads} />
              </TabsContent>
              <TabsContent value="events" className="mt-4">
                <LeadList leads={getLeadsBySegment('Awaiting Event')} />
              </TabsContent>
              <TabsContent value="nurturing" className="mt-4">
                 <LeadList leads={getLeadsBySegment('Needs Persuasion')} />
              </TabsContent>
               <TabsContent value="todos" className="mt-4">
                <TaskList tasks={getActionRequiredTasks()} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
