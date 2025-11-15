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
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
        <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedCredits}</div>
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

