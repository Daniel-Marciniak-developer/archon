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
      <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 backdrop-blur-xl shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-crystal-text-primary flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg"></div>
            Issues Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-6">
          <div className="text-center">
            <div className="text-6xl font-black text-crystal-text-primary mb-2 leading-none">
              {totalIssues.toLocaleString()}
            </div>
            <div className="text-lg font-semibold text-crystal-text-secondary">
              Total Issues Found
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {severityStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.severity}
                  className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-xl p-4 hover:border-white/40 transition-all duration-300 shadow-lg"
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/20`}>
                      <IconComponent className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className={`text-3xl font-black ${stat.color} mb-1`}>
                      {stat.count}
                    </div>
                    <div className="text-sm font-medium text-crystal-text-secondary">
                      {stat.severity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/20 pt-4">
            <h4 className="text-lg font-semibold text-crystal-text-primary mb-3">
              Issues by Category
            </h4>
            <div className="flex flex-wrap gap-3">
              {categoryStats.map((category) => (
                <div
                  key={category.name}
                  className="bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg px-4 py-2 backdrop-blur-sm shadow-md"
                >
                  <span className="text-sm font-semibold text-crystal-text-primary">
                    {category.name}: <span className="font-black">{category.count}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssuesSummary;
