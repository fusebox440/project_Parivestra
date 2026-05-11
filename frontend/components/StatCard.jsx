import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StatCard = ({ title, value, icon, change, changeType }) => {
  const changeColor = changeType === "increase" ? "text-green-500" : "text-red-500";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={changeColor}>{change}</span> from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
