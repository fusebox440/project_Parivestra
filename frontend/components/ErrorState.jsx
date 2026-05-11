import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="text-center py-16 px-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
      <h3 className="mt-4 text-lg font-medium text-destructive">An Error Occurred</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button onClick={onRetry} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
