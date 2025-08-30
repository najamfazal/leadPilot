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
import { PlusCircle, Search } from 'lucide-react';
import AddLeadForm from '@/components/leads/AddLeadForm';
import LeadList from '@/components/leads/LeadList';
import Logo from '@/components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskList from '@/components/tasks/TaskList';
import { Input } from '@/components/ui/input';
import { LeadsContext } from '@/context/LeadsContext';

export default function Home() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { leads } = useContext(LeadsContext);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);


  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">ScoreCard CRM</h1>
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
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-4">
              <TaskList />
            </TabsContent>
            <TabsContent value="leads" className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by name..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <LeadList leads={filteredLeads} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
