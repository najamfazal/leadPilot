import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge = ({ score }: ScoreBadgeProps) => {
  const getScoreColorClass = () => {
    if (score >= 75) {
      return 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30';
    }
    if (score >= 40) {
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30';
    }
    return 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30';
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-bold',
        getScoreColorClass()
      )}
    >
      {score}
    </Badge>
  );
};
export default ScoreBadge;
