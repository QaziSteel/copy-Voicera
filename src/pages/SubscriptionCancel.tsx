import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Subscription Cancelled</CardTitle>
          <CardDescription>
            Your subscription was not completed. You can try again anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/subscription")} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

