import React from "react";
import { ProjectReport } from "brain/data-contracts";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, Code, Layers } from "lucide-react";
import { getSeverityCount, getCategoryCount } from "utils/severity";

interface Props {
  report: ProjectReport;
}

const ReportHeader = ({ report }: Props) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 40) return "#f59e0b"; 
    return "#ef4444";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const totalIssues = report.issues.length;

  const categories = [
    {
      name: "Structure",
      score: report.structure_score,
      icon: Layers,
      issues: getCategoryCount(report.issues, "structure"),
      description: "Architecture",
      gradient: "from-violet-500 to-purple-600",
      lightBg: "bg-violet-50",
      darkBg: "dark:bg-violet-950/30",
      iconColor: "text-violet-600 dark:text-violet-400"
    },
    {
      name: "Quality", 
      score: report.quality_score,
      icon: Code,
      issues: getCategoryCount(report.issues, "quality"),
      description: "Best practices",
      gradient: "from-emerald-500 to-green-600", 
      lightBg: "bg-emerald-50",
      darkBg: "dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      name: "Security",
      score: report.security_score,
      icon: Shield,
      issues: getCategoryCount(report.issues, "security"),  
      description: "Vulnerabilities",
      gradient: "from-rose-500 to-red-600",
      lightBg: "bg-rose-50", 
      darkBg: "dark:bg-rose-950/30",
      iconColor: "text-rose-600 dark:text-rose-400"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-2xl border border-white/20 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-crystal-text-primary mb-2">
              {report.project_name}
            </h1>
            <p className="text-crystal-text-secondary">
              Analysis completed • {totalIssues} issues found
            </p>
          </div>
          
          <div className="text-center">
            <div className="relative inline-block">
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-40"
                style={{ 
                  background: `radial-gradient(circle, ${getScoreColor(report.overall_score)} 0%, transparent 70%)`
                }}
              />
              
              <div 
                className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl border-4"
                style={{ 
                  background: `conic-gradient(${getScoreColor(report.overall_score)} ${report.overall_score * 3.6}deg, #1f2937 0deg)`,
                  borderColor: getScoreColor(report.overall_score)
                }}
              >
                <div className="w-28 h-28 bg-gray-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-5xl font-black text-white leading-none">
                    {Math.round(report.overall_score)}
                  </span>
                  <span className="text-xs text-gray-300 font-semibold mt-1">
                    OVERALL
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-xl font-bold text-crystal-text-primary mb-2">
                Overall Score
              </div>
              <div 
                className="inline-block text-sm font-bold px-6 py-2 rounded-full border-2 shadow-lg"
                style={{ 
                  color: getScoreColor(report.overall_score),
                  backgroundColor: `${getScoreColor(report.overall_score)}15`,
                  borderColor: `${getScoreColor(report.overall_score)}60`
                }}
              >
                {getScoreStatus(report.overall_score)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.name} 
              className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 backdrop-blur-xl hover:border-white/40 transition-all duration-300 group shadow-xl"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient} shadow-lg border border-white/20`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-crystal-text-primary">
                        {category.name}
                      </h3>
                      <p className="text-sm text-crystal-text-secondary">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-black text-crystal-text-primary">
                      {category.score.toFixed(0)}%
                    </span>
                    <span className="text-sm text-crystal-text-secondary font-medium">
                      {category.issues} issues
                    </span>
                  </div>
                  
                  <Progress
                    value={category.score}
                    className="h-3 bg-white/10 rounded-full overflow-hidden"
                  />
                  
                  <div className="flex justify-center">
                    <span
                      className="text-sm font-bold px-4 py-2 rounded-full border shadow-md"
                      style={{ 
                        color: getScoreColor(category.score),
                        backgroundColor: `${getScoreColor(category.score)}15`,
                        borderColor: `${getScoreColor(category.score)}40`
                      }}
                    >
                      {getScoreStatus(category.score)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ReportHeader;



