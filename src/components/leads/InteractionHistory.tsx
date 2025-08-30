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
        <Card className="text-center py-12">
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">No Interactions Logged</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Click "Log New Interaction" to get started.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle>Interaction History</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {interactions.map(interaction => (
          <div key={interaction.id} className="p-4 border rounded-lg bg-background/50">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
              <p className="text-sm font-semibold text-foreground">
                {formatDate(interaction.date)}
              </p>
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-muted-foreground">{interaction.previousScore}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-bold text-primary">{interaction.newScore}</span>
                <Badge variant="secondary" className={interaction.interactionScore > 0 ? 'text-green-600' : interaction.interactionScore < 0 ? 'text-red-600' : ''}>
                    {interaction.interactionScore >= 0 ? '+' : ''}{interaction.interactionScore}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Intent: {interaction.intent}</Badge>
                    <Badge variant="outline">Interest: {interaction.interest}</Badge>
                    <Badge variant="outline">Action: {interaction.action}</Badge>
                </div>
                {interaction.traits.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {interaction.traits.map(trait => (
                            <Badge key={trait} variant="secondary">{trait}</Badge>
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
