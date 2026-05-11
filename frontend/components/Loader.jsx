import { Loader2 } from "lucide-react";

const Loader = ({ size = "md" }) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-24 h-24",
  };

  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className={`animate-spin text-blue-500 ${sizes[size]}`} />
    </div>
  );
};

export default Loader;
