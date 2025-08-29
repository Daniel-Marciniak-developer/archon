import React from "react";
import { Issue } from "brain/data-contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, Zap } from "lucide-react";
import { getSeverityCount, getCategoryCount } from "utils/severity";

interface Props {
  issues: Issue[];
}

const IssuesSummary = ({ issues }: Props) => {
  const totalIssues = issues.length;
  const criticalCount = getSeverityCount(issues, "critical");
  const highCount = getSeverityCount(issues, "high");
  const mediumCount = getSeverityCount(issues, "medium");
  const lowCount = getSeverityCount(issues, "low");

  const structureCount = getCategoryCount(issues, "structure");
  const qualityCount = getCategoryCount(issues, "quality");
  const securityCount = getCategoryCount(issues, "security");

  const severityStats = [
    {
      severity: "Critical",
      count: criticalCount,
      icon: Zap,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20"
    },
    {
      severity: "High",
      count: highCount,
      icon: AlertTriangle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20"
    },
    {
      severity: "Medium",
      count: mediumCount,
      icon: AlertCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20"
    },
    {
      severity: "Low",
      count: lowCount,
      icon: Info,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    }
  ];

  const categoryStats = [
    { name: "Structure", count: structureCount },
    { name: "Quality", count: qualityCount },
    { name: "Security", count: securityCount }
  ];

  return (
    <div className="space-y-6">
      <Card className="crystal-glass border-crystal-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-crystal-text-primary">
            Issues Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-crystal-text-primary mb-2">
              {totalIssues.toLocaleString()}
            </div>
            <div className="text-crystal-text-secondary">
              Total Issues Found
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {severityStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.severity}
                  className={`p-4 rounded-lg border ${stat.bgColor} ${stat.borderColor}`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 ${stat.color}`} />
                    <div>
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.count}
                      </div>
                      <div className="text-sm text-crystal-text-secondary">
                        {stat.severity}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-crystal-border pt-4">
            <h4 className="text-sm font-medium text-crystal-text-secondary mb-3">
              Issues by Category
            </h4>
            <div className="flex flex-wrap gap-2">
              {categoryStats.map((category) => (
                <Badge
                  key={category.name}
                  variant="outline"
                  className="crystal-glass border-crystal-border text-crystal-text-primary"
                >
                  {category.name}: {category.count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssuesSummary;
