import { Inbox } from "lucide-react";

const EmptyState = ({ title, message }) => {
  return (
    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="flex justify-center items-center mb-4">
        <Inbox className="w-16 h-16 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-500 mt-2">{message}</p>
    </div>
  );
};

export default EmptyState;
