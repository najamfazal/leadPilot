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
import { PlusCircle, Search, Loader2, Eye, EyeOff, CalendarIcon, Plus } from 'lucide-react';
import AddLeadForm from '@/components/leads/AddLeadForm';
import LeadList from '@/components/leads/LeadList';
import Logo from '@/components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskList from '@/components/tasks/TaskList';
import { Input } from '@/components/ui/input';
import { LeadsContext } from '@/context/LeadsContext';
import { LeadSegment } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, isPast, isToday, add } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { leads, tasks, isLoading, manualSeedDatabase } = useContext(LeadsContext);
  const [filterTasksByDate, setFilterTasksByDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const isMobile = useIsMobile();
  const [isSeeding, setIsSeeding] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);


  const handleSeed = async () => {
    setIsSeeding(true);
    await manualSeedDatabase();
    setIsSeeding(false);
  }

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads.filter(lead => lead.status !== 'Archived');
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

  const getLeadsBySegment = (segment: LeadSegment) => {
    return leads.filter(lead => lead.segment === segment && lead.status === 'Active');
  }
  
  const getTasksBySegment = (segment: LeadSegment | LeadSegment[]) => {
      const segments = Array.isArray(segment) ? segment : [segment];
      return tasks.filter(task => segments.includes(task.segment));
  }

  const allStandardTasks = useMemo(() => getTasksBySegment(['Standard Follow-up', 'Action Required', 'Payment Pending']), [tasks]);

  const overdueTasks = useMemo(() => {
    return allStandardTasks.filter(task => isPast(task.dueDate as Date) && !isToday(task.dueDate as Date));
  }, [allStandardTasks]);
  
  const overdueTasksCount = overdueTasks.length;

  const tasksForSelectedDate = useMemo(() => {
    return filterTasksByDate && selectedDate 
      ? allStandardTasks.filter(task => isSameDay(task.dueDate as Date, selectedDate))
      : allStandardTasks.filter(task => isToday(task.dueDate as Date));
  }, [allStandardTasks, filterTasksByDate, selectedDate]);


  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center p-3">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">ScoreCard CRM</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && leads.length === 0 && (
              <Button onClick={handleSeed} variant="outline" disabled={isSeeding}>
                {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Seed Data
              </Button>
            )}
            <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
              <DialogTrigger asChild>
                 <Button size={isMobile ? "icon" : "default"}>
                  {isMobile ? <Plus /> : <><PlusCircle className="mr-2 h-4 w-4" /> Add New Lead</>}
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
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-3 md:p-4">
          {isLoading && !leads.length ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <Tabs defaultValue="tasks" className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="min-w-max w-full grid grid-cols-4">
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                    <TabsTrigger value="nurture">Nurture</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="tasks" className="mt-4">
                <div className='flex items-center gap-2 mb-3'>
                    <Button variant="outline" size="icon" onClick={() => setFilterTasksByDate(!filterTasksByDate)}>
                        {filterTasksByDate ? <EyeOff /> : <Eye />}
                    </Button>
                    {filterTasksByDate && (
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                size="icon"
                                className={cn(!selectedDate && "text-muted-foreground")}
                                >
                                <CalendarIcon className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                   
                    {overdueTasksCount > 0 && (
                         <Button variant="ghost" className="ml-auto p-0 h-auto" onClick={() => setShowOverdue(!showOverdue)}>
                             <Badge variant={showOverdue ? "default" : "destructive"} className="cursor-pointer transition-colors">
                                {overdueTasksCount} Overdue
                             </Badge>
                         </Button>
                    )}
                </div>
                 <div className="space-y-4">
                  {showOverdue && overdueTasks.length > 0 && (
                      <TaskList tasks={overdueTasks} title="Overdue" />
                  )}
                  <TaskList
                      tasks={tasksForSelectedDate}
                      title={format(filterTasksByDate && selectedDate ? selectedDate : new Date(), "'Tasks for' PPP")}
                  />
                </div>
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
              <TabsContent value="nurture" className="mt-4">
                 <TaskList tasks={getTasksBySegment('Needs Nurturing')} title="Nurturing Queue"/>
              </TabsContent>
               <TabsContent value="events" className="mt-4">
                <TaskList tasks={getTasksBySegment('Awaiting Event')} title="Upcoming Events"/>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
