import { Bell, User } from "lucide-react";

const Navbar = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Bell className="w-6 h-6 text-gray-500" />
        <User className="w-6 h-6 text-gray-500" />
      </div>
    </header>
  );
};

export default Navbar;
