import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ErrorState = ({ title, message, onRetry }) => {
  return (
    <div className="text-center p-8 border-2 border-dashed border-red-300 bg-red-50 rounded-lg">
      <div className="flex justify-center items-center mb-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-red-800">{title}</h3>
      <p className="text-red-600 mt-2">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-4">
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
