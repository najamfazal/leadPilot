import { Interaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageSquare, History } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

type InteractionHistoryProps = {
  interactions: Interaction[];
};

const formatDate = (date: Date | Timestamp) => {
    if (date instanceof Timestamp) {
        return date.toDate().toLocaleString();
    }
    return date.toLocaleString();
}

export default function InteractionHistory({ interactions }: InteractionHistoryProps) {
  if (interactions.length === 0) {
    return (
        <Card className="text-center py-8">
            <CardHeader className='p-4'>
                <div className="mx-auto bg-secondary rounded-full p-2.5 w-fit">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="mt-3 text-lg">No Interactions Logged</CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0'>
                <p className="text-muted-foreground text-sm">Click "Log New Interaction" to get started.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='p-4'>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle className='text-xl'>Interaction History</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {interactions.map(interaction => (
          <div key={interaction.id} className="p-3 border rounded-lg bg-background/50">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
              <p className="text-xs font-semibold text-foreground">
                {formatDate(interaction.date)}
              </p>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground">{interaction.previousScore}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-bold text-primary">{interaction.newScore}</span>
                <Badge variant="secondary" className={cn("text-xs", interaction.interactionScore > 0 ? 'text-green-600' : interaction.interactionScore < 0 ? 'text-red-600' : '')}>
                    {interaction.interactionScore >= 0 ? '+' : ''}{interaction.interactionScore}
                </Badge>
              </div>
            </div>
            <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">Intent: {interaction.intent}</Badge>
                    <Badge variant="outline" className="text-xs">Interest: {interaction.interest}</Badge>
                    <Badge variant="outline" className="text-xs">Action: {interaction.action}</Badge>
                </div>
                {interaction.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {interaction.traits.map(trait => (
                            <Badge key={trait} variant="secondary" className="text-xs">{trait}</Badge>
                        ))}
                    </div>
                )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
