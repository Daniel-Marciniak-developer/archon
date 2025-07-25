import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from "recharts";
import { ProjectResponse } from "types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  GitBranch,
  Calendar,
  Activity,
  Github,
  Upload,
  Trash2,
  Code2,
  MoreVertical,
  Play,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from '@stackframe/react';
import { toast } from 'sonner';
import brain from 'brain';

interface Props {
  project: ProjectResponse;
  onProjectDeleted?: () => void;
}

const getScoreColor = (score: number | null | undefined) => {
  if (score === null || score === undefined) return "#848488"; // Muted secondary text color
  if (score >= 80) return "#52C41A"; // Success Green
  if (score >= 40) return "#FFA940"; // Warning Amber
  return "#FF4D4F"; // Critical Red
};

export function ProjectCard({ project, onProjectDeleted }: Props) {
  const navigate = useNavigate();
  const user = useUser();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const score = project.latest_analysis?.overall_score;
  const color = getScoreColor(score);
  const hasAnalysis = project.latest_analysis && project.latest_analysis.status === 'completed';
  const isAnalysisRunning = project.latest_analysis && (project.latest_analysis.status === 'pending' || project.latest_analysis.status === 'running');

  const chartData = [{ name: 'score', value: score ?? 0, fill: color }];

  const handleDeleteProject = async () => {
    if (!user) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await brain.delete_project(project.id);

      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.status}`);
      }

      const result = await response.json();
      toast.success(`Project ${result.project_name} deleted successfully`);

      if (onProjectDeleted) {
        onProjectDeleted();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') ||
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    if (hasAnalysis) {
      navigate(`/projects/${project.id}/report`);
    }
  };

  return (
    <>
      <Card
        className="crystal-glass border-crystal-border hover:border-crystal-electric transition-colors flex flex-col cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{project.repo_owner} / {project.repo_name}</CardTitle>
              <CardDescription className="text-crystal-text-secondary">
                Click to view the detailed analysis report.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`${
                  project.project_source === 'upload'
                    ? 'border-crystal-electric text-crystal-electric bg-crystal-electric/10'
                    : 'border-crystal-text-secondary text-crystal-text-secondary'
                }`}
              >
                {project.project_source === 'upload' ? (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    Uploaded
                  </>
                ) : (
                  <>
                    <Github className="w-3 h-3 mr-1" />
                    GitHub
                  </>
                )}
              </Badge>

              {}
              <DropdownMenu>
                <DropdownMenuTrigger asChild data-dropdown-trigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-crystal-surface"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="crystal-surface border-crystal-border">
                  {project.project_source === 'github' && (
                    <DropdownMenuItem
                      onClick={(e: any) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}/repository`);
                      }}
                      className="hover:bg-crystal-electric/10"
                    >
                      <Code2 className="mr-2 h-4 w-4" />
                      View Repository
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                    className="hover:bg-crystal-critical/10 text-crystal-critical"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              barSize={10}
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={5}
                className="crystal-glass"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            {isAnalysisRunning || isAnalyzing ? (
              <Loader2 className="w-8 h-8 animate-spin text-crystal-electric" />
            ) : (
              <span className="text-2xl font-bold" style={{ color }}>
                {score !== null && score !== undefined ? `${Math.round(score)}%` : 'N/A'}
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm font-medium" style={{ color }}>
          {isAnalysisRunning || isAnalyzing ? 'Analyzing...' : 'Overall Health Score'}
        </p>
      </CardContent>
        <div className="p-6 pt-0 space-y-2">
          {hasAnalysis ? (
            <Button
              onClick={(e: any) => {
                e.stopPropagation();
                navigate(`/projects/${project.id}/report`);
              }}
              className="crystal-btn-primary w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Report
            </Button>
          ) : isAnalysisRunning || isAnalyzing ? (
            <Button
              disabled
              className="crystal-btn-primary w-full opacity-50"
            >
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </Button>
          ) : (
            <Button
              onClick={async (e: any) => {
                e.stopPropagation();
                try {
                  setIsAnalyzing(true);
                  await brain.start_analysis({ projectId: project.id });
                  navigate(`/projects/${project.id}/report`);
                } catch (error) {
                  toast.error('Failed to start analysis');
                  setIsAnalyzing(false);
                }
              }}
              className="crystal-btn-primary w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Analyze
            </Button>
          )}

          {project.project_source === 'github' && (
            <Button
              onClick={(e: any) => {
                e.stopPropagation();
                navigate(`/projects/${project.id}/repository`);
              }}
              variant="outline"
              className="w-full border-crystal-border hover:bg-crystal-surface"
            >
              <Code2 className="w-4 h-4 mr-2" />
              View Repository
            </Button>
          )}
        </div>
      </Card>

      {}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="crystal-surface border-crystal-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-crystal-text-primary">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-crystal-text-secondary">
              Are you sure you want to delete <strong>{project.repo_owner}/{project.repo_name}</strong>?
              This action cannot be undone and will permanently remove all analysis data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-crystal-border hover:bg-crystal-surface"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-crystal-critical hover:bg-crystal-critical/90 text-white"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}






