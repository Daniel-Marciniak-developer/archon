import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import ReportHeader from "components/ReportHeader";
import IssuesList from "components/IssuesList";
import IssuesSummary from "components/IssuesSummary";
import brain from "brain";
import { useEffect, useState } from "react";
import { ProjectReport } from "brain/data-contracts";
import { MainLayout } from "components/MainLayout";
import ReportPageSkeleton from "components/ReportPageSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useProjects } from "utils/useProjects";

const ProjectReportPage = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();


  const projectId = params.id || searchParams.get("projectId");

  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useProjects();





  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    if (projectId) {
      const fetchReport = async () => {
        try {
          setLoading(true);
          const response = await brain.get_project_report({ projectId: parseInt(projectId, 10) });
          const data = await response.json();
          if (response.ok) {
            setReport(data);
          } else {
            throw new Error(data.detail || "Failed to fetch report");
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    }
  }, [projectId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <ReportPageSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!report) {
    return <div className="p-8">No report found for this project.</div>;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-crystal-void">
        <div className="w-full px-6 py-8 space-y-8">
          {/* Back Button - Full Width */}
          <div className="bg-crystal-void/50 border border-crystal-electric/20 rounded-xl p-4">
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              className="crystal-glass border-crystal-border hover:bg-crystal-surface"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Report Content - Full Width */}
          <div className="w-full space-y-8">
            <ReportHeader report={report} />
            <IssuesSummary issues={report.issues} />
            <IssuesList issues={report.issues} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectReportPage;





