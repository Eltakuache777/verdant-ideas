"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { FolderKanban, Sparkles, Package, Store } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { Card, PageHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  status?: string;
  designImageUrl?: string;
  createdAt?: { toMillis?: () => number };
}

const statusStyles: Record<string, string> = {
  Draft: "bg-black/5 text-ink-600",
  "In Progress": "bg-amber-100 text-amber-800",
  Complete: "bg-brand-100 text-brand-800",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "projects"), where("ownerId", "==", user.uid));
        const snapshot = await getDocs(q);

        const projectList = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Project, "id">) }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

        setProjects(projectList);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="My Projects"
        description="All of your saved Verdant Ideas projects."
        action={
          <Link href="/dashboard/new-project">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        }
      />

      {loading && <p className="text-sm text-ink-500">Loading projects…</p>}

      {!loading && projects.length === 0 && (
        <Card className="flex flex-col items-center gap-3 px-8 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <FolderKanban className="h-6 w-6" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-ink-900">No projects yet</h2>
          <p className="max-w-sm text-sm text-ink-500">
            Create your first project to start building with Verdant Forge.
          </p>
          <Link href="/dashboard/new-project" className="mt-2">
            <Button size="sm">Create a project</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden p-0">
            {project.designImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.designImageUrl}
                alt={project.name}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-black/[0.03] text-ink-500/40">
                <FolderKanban className="h-8 w-8" strokeWidth={1.5} />
              </div>
            )}

            <div className="p-6">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-ink-900">{project.name}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    statusStyles[project.status ?? "Draft"] ?? statusStyles.Draft
                  }`}
                >
                  {project.status ?? "Draft"}
                </span>
              </div>

              {project.type && (
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {project.type}
                </p>
              )}

              {project.description && (
                <p className="mt-3 line-clamp-3 text-sm text-ink-500">{project.description}</p>
              )}

              {project.designImageUrl && (
                <div className="mt-4 space-y-2">
                  <Link href={`/dashboard/orders/new?projectId=${project.id}`} className="block">
                    <Button size="sm" variant="secondary" className="w-full">
                      <Package className="mr-2 h-4 w-4" />
                      Send to manufacturing
                    </Button>
                  </Link>
                  <Link href={`/dashboard/catalog/new?projectId=${project.id}`} className="block">
                    <Button size="sm" variant="secondary" className="w-full">
                      <Store className="mr-2 h-4 w-4" />
                      Create product catalog
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
