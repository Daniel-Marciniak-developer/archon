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

  const getCategoryColor = (categoryName: string) => {
    switch(categoryName) {
      case 'Structure': return '#a855f7';
      case 'Quality': return '#10b981';
      case 'Security': return '#ef4444';
      default: return '#a855f7';
    }
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
      <div className="bg-crystal-void/50 border border-crystal-electric/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-crystal-text mb-2">
              {report.project_name}
            </h1>
            <p className="text-crystal-text/70">
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
                className="relative w-36 h-36 rounded-full flex items-center justify-center border-4"
                style={{ 
                  background: `conic-gradient(${getScoreColor(report.overall_score)} ${report.overall_score * 3.6}deg, hsl(var(--crystal-void)) 0deg)`,
                  borderColor: getScoreColor(report.overall_score)
                }}
              >
                <div className="w-28 h-28 bg-crystal-void rounded-full flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-crystal-text leading-none">
                    {Math.round(report.overall_score)}
                  </span>
                  <span className="text-xs text-crystal-text/70 font-semibold mt-1">
                    OVERALL
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-xl font-bold text-crystal-text mb-2">
                Overall Score
              </div>
              <div 
                className="inline-block text-sm font-bold px-6 py-2 rounded-full border-2"
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
              className="bg-crystal-void/50 border border-crystal-electric/20 hover:border-crystal-electric/40 transition-all duration-300 group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${category.gradient} border border-crystal-electric/20`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-crystal-text">
                        {category.name}
                      </h3>
                      <p className="text-sm text-crystal-text/70">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-black text-crystal-text">
                      {category.score.toFixed(0)}%
                    </span>
                    <span className="text-sm text-crystal-text/70 font-medium">
                      {category.issues} issues
                    </span>
                  </div>
                  
                  <Progress
                    value={category.score}
                    color={getCategoryColor(category.name)}
                    className="h-3 bg-crystal-void/30 rounded-full overflow-hidden"
                  />
                  
                  <div className="flex justify-center">
                    <span
                      className="text-sm font-bold px-4 py-2 rounded-full border"
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

      {report.structure_analysis?.hotspot_files && report.structure_analysis.hotspot_files.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-crystal-text mb-4">
            🔥 Structure Hotspots
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {report.structure_analysis.hotspot_files.slice(0, 6).map((hotspot, index) => (
              <Card key={index} className="bg-crystal-void/50 border-crystal-electric/20 hover:scale-105 transition-transform duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-crystal-text truncate" title={hotspot.file_path}>
                        {hotspot.file_path.split('/').pop()}
                      </div>
                      <div className="text-xs text-crystal-text/70 mt-1">
                        {hotspot.file_path.split('/').slice(0, -1).join('/')}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        hotspot.priority === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : hotspot.priority === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {hotspot.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-crystal-text/70">Risk Score:</span>
                      <span className="font-medium ml-1 text-crystal-text">{(hotspot.risk_score * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-crystal-text/70">Issues:</span>
                      <span className="font-medium ml-1 text-crystal-text">{hotspot.issues_count}</span>
                    </div>
                    <div>
                      <span className="text-crystal-text/70">Lines:</span>
                      <span className="font-medium ml-1 text-crystal-text">{hotspot.sloc}</span>
                    </div>
                    <div>
                      <span className="text-crystal-text/70">Complexity:</span>
                      <span className="font-medium ml-1 text-crystal-text">{(hotspot.complexity_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {report.structure_analysis.hotspot_files.length > 6 && (
            <div className="text-center mt-4">
              <span className="text-sm text-crystal-text/70">
                +{report.structure_analysis.hotspot_files.length - 6} more hotspots
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportHeader;



