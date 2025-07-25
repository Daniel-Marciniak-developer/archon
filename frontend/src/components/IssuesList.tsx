import React, { useState, useMemo } from "react";
import { Issue } from "brain/data-contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";

interface Props {
  issues: Issue[];
}

const ITEMS_PER_PAGE = 20;

const formatIssueDescription = (issue: Issue) => {
  if (issue.category.toLowerCase() === "security") {
    const parts = issue.description.split(" | ");
    const mainDescription = parts[0];

    const confidencePart = parts.find(p => p.includes("Confidence:") && !p.includes("Severity:"));
    const columnsPart = parts.find(p => p.includes("Columns:"));

    let cleanConfidencePart = confidencePart;
    if (confidencePart && confidencePart.includes("Severity:")) {
      const confidenceMatch = confidencePart.match(/Confidence:\s*\w+/);
      cleanConfidencePart = confidenceMatch ? confidenceMatch[0] : null;
    }

    let formattedDesc = mainDescription;
    if (cleanConfidencePart) {
      formattedDesc += ` | ${cleanConfidencePart}`;
    }
    if (columnsPart) {
      formattedDesc += ` | ${columnsPart}`;
    }

    if (issue.end_line && issue.start_line && issue.end_line !== issue.start_line) {
      formattedDesc += ` | Lines: ${issue.start_line}-${issue.end_line}`;
    } else if (issue.line_number) {
      formattedDesc += ` | Line: ${issue.line_number}`;
    }

    return formattedDesc;
  } else if (issue.category.toLowerCase() === "quality") {
    const parts = issue.description.split(" | ");
    const mainDescription = parts[0];

    const columnsPart = parts.find(p => p.includes("Columns:"));
    const fixPart = parts.find(p => p.includes("Fix:"));

    let formattedDesc = mainDescription;
    if (columnsPart) {
      formattedDesc += ` | ${columnsPart}`;
    }
    if (fixPart) {
      formattedDesc += ` | ${fixPart}`;
    }

    if (issue.end_line && issue.start_line && issue.end_line !== issue.start_line) {
      formattedDesc += ` | Lines: ${issue.start_line}-${issue.end_line}`;
    } else if (issue.line_number) {
      formattedDesc += ` | Line: ${issue.line_number}`;
    }

    return formattedDesc;
  }

  return issue.description;
};

const IssuesList = ({ issues }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.file_path.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity =
        severityFilter === "all" ||
        issue.severity.toLowerCase() === severityFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "all" ||
        issue.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [issues, searchTerm, severityFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredIssues.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const uniqueSeverities = [...new Set(issues.map(issue => issue.severity))]
    .sort((a, b) => {
      const order = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  const uniqueCategories = [...new Set(issues.map(issue => issue.category))];

  const resetFilters = () => {
    setSearchTerm("");
    setSeverityFilter("all");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <Card className="crystal-glass border-crystal-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-crystal-text-primary flex items-center">
            <FileText className="w-5 h-5 mr-2 text-crystal-electric" />
            Detailed Issues ({filteredIssues.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-crystal-text-secondary" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 crystal-glass border-crystal-border"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full lg:w-48 crystal-glass border-crystal-border">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48 crystal-glass border-crystal-border">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={resetFilters}
              className="crystal-glass border-crystal-border"
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            {paginatedIssues.length === 0 ? (
              <div className="text-center py-8 text-crystal-text-secondary">
                No issues found matching your filters.
              </div>
            ) : (
              paginatedIssues.map((issue, index) => (
                <Card key={issue.id || index} className="crystal-surface border-crystal-border">
                  <CardContent className="p-0">
                    <div
                      className="flex items-center p-4 cursor-pointer hover:bg-crystal-surface/50 transition-colors"
                      onClick={() => toggleExpand(index)}
                    >
                      <Badge className={`mr-4 ${getSeverityBadgeColor(issue.severity)}`}>
                        {issue.severity}
                      </Badge>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-crystal-text-primary truncate">
                          {issue.title}
                        </div>
                        <div className="text-sm text-crystal-text-secondary">
                          {issue.file_path}:{issue.line_number}
                        </div>
                      </div>

                      <Badge variant="outline" className="mr-4 crystal-glass border-crystal-border">
                        {issue.category}
                      </Badge>

                      {expanded[issue.id] ? (
                        <ChevronDown className="w-5 h-5 text-crystal-text-secondary" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-crystal-text-secondary" />
                      )}
                    </div>

                    {expanded[index] && (
                      <div className="border-t border-crystal-border p-4 bg-crystal-surface/30">
                        <p className="text-crystal-text-secondary leading-relaxed">
                          {formatIssueDescription(issue)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-crystal-text-secondary">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredIssues.length)} of {filteredIssues.length} issues
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="crystal-glass border-crystal-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-sm text-crystal-text-primary">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="crystal-glass border-crystal-border"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IssuesList;



