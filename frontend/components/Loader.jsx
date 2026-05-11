import { Loader2 } from "lucide-react";

const Loader = ({ size = "md", text = "Loading..." }) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-24 h-24",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Loader2 className={`animate-spin text-blue-500 ${sizes[size]}`} />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
};

export default Loader;
