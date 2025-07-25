import { Issue } from "brain/data-contracts";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  issues: Issue[];
}

const IssuesList = ({ issues }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-crystal-critical";
      case "high":
        return "bg-crystal-high";
      case "medium":
        return "bg-crystal-medium"; // Assuming you have a medium color
      case "low":
        return "bg-crystal-low"; // Assuming you have a low color
      default:
        return "bg-crystal-text-secondary";
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-crystal-text-primary">Issues</h2>
      <div className="flex flex-col gap-2">
        {issues.map((issue) => (
          <div key={issue.id} className="crystal-surface rounded-lg overflow-hidden">
            <div
              className="flex items-center p-4 cursor-pointer"
              onClick={() => toggleExpand(issue.id)}
            >
              <div
                className={`w-3 h-3 rounded-full mr-4 ${getSeverityColor(
                  issue.severity
                )}`}
              ></div>
              <div className="flex-1 font-semibold text-crystal-text-primary">{issue.title}</div>
              <div className="text-sm text-crystal-text-secondary mr-4">{`${issue.file_path}:${issue.line_number}`}</div>
              {expanded[issue.id] ? (
                <ChevronDown size={20} className="text-crystal-text-secondary" />
              ) : (
                <ChevronRight size={20} className="text-crystal-text-secondary" />
              )}
            </div>
            {expanded[issue.id] && (
              <div className="pb-4 px-4 border-t border-crystal-border pt-3">
                <p className="text-crystal-text-secondary">{issue.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IssuesList;



