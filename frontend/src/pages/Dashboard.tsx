import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "utils/useProjects";
import { ProjectCard } from "components/ProjectCard";
import { MainLayout } from "components/MainLayout";
import { AddProjectModal } from "components/AddProjectModal";
import { Button } from "@/components/ui/button";
import { PlusCircle, Github, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { ProjectResponse } from "types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCardSkeleton } from "components/SkeletonLoaders";

const Dashboard = () => {
  const { projects, loading, error, refetch } = useProjects();
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleProjectAdded = (projectId?: number) => {


    refetch();
    setModalOpen(false);


    if (projectId) {

      navigate(`/projects/${projectId}/repository`);
    }
  };





  const handleAddProject = () => {

    setModalOpen(true);
  };

  const RenderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {

      return (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-crystal-surface/20 rounded-lg">
          <AlertCircle className="w-12 h-12 text-crystal-critical" />
          <h2 className="mt-4 text-xl font-semibold text-crystal-text-primary">
            Failed to load projects
          </h2>
          <p className="mt-2 text-crystal-text-secondary">
            {error}
          </p>
          <Button onClick={() => refetch()} className="mt-6 crystal-button-violet">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      );
    }

    if (projects.length === 0) {

      return (
        <div className="text-center py-20 bg-crystal-surface/20 rounded-lg">
          <h2 className="text-2xl font-bold text-crystal-text-primary">No Projects Yet</h2>
          <p className="mt-2 text-crystal-text-secondary">
            Get started by adding your first GitHub repository.
          </p>
        </div>
      );
    }


    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onProjectDeleted={() => {

              refetch();
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-crystal-text-primary">
            Dashboard
          </h1>
          <Button
            className="crystal-button-violet"
            onClick={() => handleAddProject()}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Project
          </Button>
        </div>

        <RenderContent />
      </div>
      <AddProjectModal
        open={isModalOpen}
        onOpenChange={setModalOpen}
        onProjectAdded={handleProjectAdded}
        existingProjects={projects}
      />
    </MainLayout>
  );
}

export default Dashboard;





