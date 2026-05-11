"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  const handleClear = () => {
    // Simulate an event with an empty value
    const syntheticEvent = {
      target: {
        value: "",
      },
    };
    onChange(syntheticEvent);
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-10 pr-10 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
