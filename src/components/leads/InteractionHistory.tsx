import React, { useState } from 'react';
import { Interaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowUp, ArrowDown, History, ChevronDown, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';


type InteractionHistoryProps = {
  interactions: Interaction[];
};

const formatDate = (date: Date | Timestamp) => {
    let d = date instanceof Timestamp ? date.toDate() : date;
    return format(d, `MMM dd, yy 'at' h:mm a`);
}

const ChangeIndicator = ({ change }: { change: 'increase' | 'decrease' | 'same' }) => {
    if (change === 'increase') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (change === 'decrease') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
}

const getChange = (oldVal: number, newVal: number): 'increase' | 'decrease' | 'same' => {
    if (newVal > oldVal) return 'increase';
    if (newVal < oldVal) return 'decrease';
    return 'same';
}

const factorMapping = {
    interest: { 'Love': 5, 'High': 4, 'Unsure': 3, 'Low': 2, 'Hate': 1 },
    intent: { 'High': 3, 'Neutral': 2, 'Low': 1},
    engagement: { 'Positive': 3, 'Neutral': 2, 'Negative': 1}
}


export default function InteractionHistory({ interactions }: InteractionHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(3);
  
  if (interactions.length === 0) {
    return (
        <div className="text-center py-8 px-4">
            <div className="mx-auto bg-secondary rounded-full p-2.5 w-fit">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-lg font-semibold">No Interactions Logged</h3>
            <p className="text-muted-foreground text-sm mt-1">Click "Log" to get started.</p>
        </div>
    );
  }

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + 5);
  }
  
  const sortedInteractions = [...interactions].sort((a,b) => (b.date as Date).getTime() - (a.date as Date).getTime());

  const visibleInteractions = sortedInteractions.slice(0, visibleCount);
  
  const getPreviousInteraction = (currentIndex: number) => {
      if (currentIndex + 1 < sortedInteractions.length) {
          return sortedInteractions[currentIndex + 1];
      }
      return null;
  }

  return (
    <div className="space-y-3 p-4 pt-0">
        {visibleInteractions.map((interaction, index) => {
          const prevInteraction = getPreviousInteraction(index);

          const interestChange = prevInteraction ? getChange(factorMapping.interest[prevInteraction.interest], factorMapping.interest[interaction.interest]) : 'same';
          const intentChange = prevInteraction ? getChange(factorMapping.intent[prevInteraction.intent], factorMapping.intent[interaction.intent]) : 'same';
          const engagementChange = prevInteraction ? getChange(factorMapping.engagement[prevInteraction.engagement], factorMapping.engagement[interaction.engagement]) : 'same';

          return (
          <div key={interaction.id} className="p-3 border rounded-lg bg-background/50">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
              <p className="text-xs font-semibold text-foreground">
                {formatDate(interaction.date)}
              </p>
              {interaction.type !== 'Creation' && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-muted-foreground">{interaction.previousScore}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-bold text-primary">{interaction.newScore}</span>
                  <Badge variant="secondary" className={cn("text-xs", interaction.interactionScore > 0 ? 'text-green-600' : interaction.interactionScore < 0 ? 'text-red-600' : '')}>
                      {interaction.interactionScore >= 0 ? '+' : ''}{interaction.interactionScore}
                  </Badge>
                </div>
              )}
            </div>
            {interaction.type === 'Engagement' ? (
              <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">Interest: {interaction.interest} <ChangeIndicator change={interestChange} /></Badge>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">Intent: {interaction.intent} <ChangeIndicator change={intentChange}/></Badge>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">Engagement: {interaction.engagement} <ChangeIndicator change={engagementChange} /></Badge>
                  </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{interaction.notes}</p>
            )}
          </div>
        )})}
        {sortedInteractions.length > visibleCount && (
            <Button variant="outline" className="w-full" onClick={handleLoadMore}>
                <ChevronDown className="mr-2 h-4 w-4" />
                Load More
            </Button>
        )}
      </div>
  );
}
