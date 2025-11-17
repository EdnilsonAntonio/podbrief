import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard as CreditCardIcon, Zap } from "lucide-react";

interface CreditCardProps {
  credits: number;
  plan?: string;
}

export function CreditCard({ credits, plan }: CreditCardProps) {
  const formattedCredits = credits % 1 === 0 
    ? credits.toFixed(0) 
    : credits.toFixed(2);
  
  const isLow = credits < 10;
  
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
      isLow ? "border-orange-200 dark:border-orange-900 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20" : ""
    }`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
        <div className={`rounded-lg p-2 transition-colors ${
          isLow 
            ? "bg-orange-100 dark:bg-orange-900/30" 
            : "bg-primary/10 group-hover:bg-primary/20"
        }`}>
          <CreditCardIcon className={`h-4 w-4 ${
            isLow ? "text-orange-600 dark:text-orange-400" : "text-primary"
          }`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${
          isLow ? "text-orange-600 dark:text-orange-400" : ""
        }`}>{formattedCredits}</div>
        <p className="text-xs text-muted-foreground">
          {formattedCredits} {credits === 1 ? "minute" : "minutes"} of transcription available
        </p>
                {plan && (
                    <div className="mt-2">
                        <Badge variant="secondary" className="flex w-fit items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {plan} Plan
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

