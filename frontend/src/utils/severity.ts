export const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "hsl(var(--crystal-critical))";
    case "high":
      return "hsl(var(--crystal-high))";
    case "medium":
      return "hsl(var(--crystal-electric))";
    case "low":
      return "hsl(var(--crystal-text-secondary))";
    default:
      return "hsl(var(--crystal-text-secondary))";
  }
};

export const getSeverityBgColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

export const getSeverityTextColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "text-red-500";
    case "high":
      return "text-orange-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
};

export const getSeverityCount = (issues: any[], severity: string): number => {
  return issues.filter(issue => issue.severity.toLowerCase() === severity.toLowerCase()).length;
};

export const getCategoryCount = (issues: any[], category: string): number => {
  return issues.filter(issue => issue.category.toLowerCase() === category.toLowerCase()).length;
};
