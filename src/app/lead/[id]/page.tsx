'use client';

import { useContext, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LeadsContext } from '@/context/LeadsContext';
import LeadDetails from '@/components/leads/LeadDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { leads, interactions, tasks, isLoading } = useContext(LeadsContext);

  const leadId = params.id as string;
  
  if (isLoading && !leads.find(l => l.id === leadId)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const lead = useMemo(() => leads.find(l => l.id === leadId), [leads, leadId]);

  const leadInteractions = useMemo(() => interactions
    .filter(i => i.leadId === leadId)
    .sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime()), [interactions, leadId]);
    
  const pendingTask = useMemo(() => tasks.find(t => t.leadId === leadId && !t.completed), [tasks, leadId]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Lead Not Found</h2>
        <p className="text-muted-foreground mb-6">The lead you are looking for does not exist or has been moved.</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Leads
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto flex items-center p-4 gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
                <Logo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground">ScoreCard CRM</h1>
            </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6">
          <LeadDetails lead={lead} interactions={leadInteractions} task={pendingTask} />
        </div>
      </main>
    </div>
  );
}
