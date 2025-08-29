import React from "react";
import { ProjectReport } from "brain/data-contracts";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Shield, Code, Layers } from "lucide-react";
import { getSeverityCount, getCategoryCount } from "utils/severity";

interface Props {
  report: ProjectReport;
}

const ReportHeader = ({ report }: Props) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52C41A";
    if (score >= 40) return "#FFA940";
    return "#FF4D4F";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const overallScoreColor = getScoreColor(report.overall_score);
  const totalIssues = report.issues.length;
  const criticalIssues = getSeverityCount(report.issues, "critical");
  const highIssues = getSeverityCount(report.issues, "high");
  const mediumIssues = getSeverityCount(report.issues, "medium");
  const lowIssues = getSeverityCount(report.issues, "low");

  const categories = [
    {
      name: "Structure",
      score: report.structure_score,
      icon: Layers,
      issues: getCategoryCount(report.issues, "structure"),
      description: "Code organization and architecture",
      gradient: "from-blue-500 to-purple-600",
      bgClass: "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
    },
    {
      name: "Quality", 
      score: report.quality_score,
      icon: Code,
      issues: getCategoryCount(report.issues, "quality"),
      description: "Code style and best practices",
      gradient: "from-green-500 to-emerald-600",
      bgClass: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
    },
    {
      name: "Security",
      score: report.security_score,
      icon: Shield,
      issues: getCategoryCount(report.issues, "security"),  
      description: "Security vulnerabilities and risks",
      gradient: "from-red-500 to-orange-600",
      bgClass: "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-crystal-text-primary mb-2">
          {report.project_name}
        </h1>
        <p className="text-crystal-text-secondary">
          Code analysis report with {totalIssues} issues found
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="crystal-glass border-crystal-border lg:col-span-1">
          <CardContent className="p-8 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-crystal-text-primary mb-6">
              Overall Score
            </h2>
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="90%"
                  data={[{ value: report.overall_score }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar
                    background={{ fill: "hsl(var(--crystal-border))" }}
                    dataKey="value"
                    cornerRadius={8}
                    fill={overallScoreColor}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-crystal-text-primary">
                  {Math.round(report.overall_score)}
                </span>
                <span className="text-sm text-crystal-text-secondary mt-1">
                  {getScoreStatus(report.overall_score)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.name} className={`crystal-glass border-crystal-border hover:shadow-lg transition-all duration-300 ${category.bgClass}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${category.gradient}`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-crystal-text-primary">
                          {category.name}
                        </h3>
                        <p className="text-xs text-crystal-text-secondary">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-crystal-text-primary">
                      {category.score.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={category.score}
                    className="mb-3"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-crystal-text-secondary">
                      {category.issues} issues
                    </span>
                    <span
                      className="text-sm font-medium px-2 py-1 rounded-full"
                      style={{ 
                        color: getScoreColor(category.score),
                        backgroundColor: `${getScoreColor(category.score)}20`
                      }}
                    >
                      {getScoreStatus(category.score)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;



