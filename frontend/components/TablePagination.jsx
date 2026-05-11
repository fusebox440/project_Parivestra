import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-zinc-400">
        Page <span className="font-medium text-white">{currentPage}</span> of{" "}
        <span className="font-medium text-white">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50"
        >
          <span className="mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
