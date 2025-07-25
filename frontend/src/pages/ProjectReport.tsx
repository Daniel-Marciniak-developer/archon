import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import ReportHeader from "components/ReportHeader";
import IssuesList from "components/IssuesList";
import brain from "brain";
import { useEffect, useState } from "react";
import { ProjectReport } from "brain/data-contracts";
import { getSeverityColor } from "utils/severity";
import { MainLayout } from "components/MainLayout";
import ReportPageSkeleton from "components/ReportPageSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ProjectReportPage = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();


  const projectId = params.id || searchParams.get("projectId");

  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);





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
      <div className="p-8">
        {}
        <div className="mb-6">
          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            className="border-crystal-border hover:bg-crystal-surface"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <ReportHeader report={report} />
        <IssuesList issues={report.issues} />
      </div>
    </MainLayout>
  );
};

export default ProjectReportPage;





