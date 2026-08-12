"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, UploadCloud, X } from "lucide-react";

import { auth } from "@/app/lib/firebase";
import { uploadDesignFile } from "@/app/lib/uploadDesign";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const projectTypes = [
  "Clothing & Uniforms",
  "Product Design",
  "Furniture",
  "Packaging",
  "Home Decor",
];

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [description, setDescription] = useState("");
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileSelect(file: File | undefined) {
    if (!file) return;

    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
  }

  function clearFile() {
    setDesignFile(null);
    setDesignPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function createProject() {
    if (!projectName.trim()) {
      setError("Please enter a project name.");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    setError("");

    try {
      setLoading(true);

      let designImageUrl = "";

      if (designFile) {
        designImageUrl = await uploadDesignFile(user.uid, designFile);
      }

      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          type: projectType,
          description,
          ownerId: user.uid,
          designImageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      router.push("/dashboard/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Create New Project"
        description="Start building your next idea with Verdant Forge."
      />

      <Card className="max-w-2xl p-8">
        <div className="space-y-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <Label>Project Name</Label>
            <Input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Example: Landscaping Uniform"
            />
          </div>

          <div>
            <Label>Project Type</Label>
            <Select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              {projectTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Describe Your Idea</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe what you want Verdant Forge to create…"
            />
          </div>

          <div>
            <Label>Design Image (optional)</Label>
            <p className="mb-3 -mt-1 text-xs text-ink-500">
              Upload artwork or a logo now, or generate one later in Verdant Forge and attach it
              here.
            </p>

            {designPreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={designPreview}
                  alt="Design preview"
                  className="h-40 w-40 rounded-xl border border-black/10 object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-white shadow"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-black/15 px-6 py-10 text-center transition hover:border-brand-600/40 hover:bg-brand-50/40"
              >
                <UploadCloud className="h-6 w-6 text-ink-500" strokeWidth={1.75} />
                <span className="text-sm font-medium text-ink-700">Click to upload an image</span>
                <span className="text-xs text-ink-500">PNG, JPG up to ~10MB</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>

          <Button onClick={createProject} disabled={loading}>
            {loading ? "Creating project…" : "Create project"}
          </Button>
        </div>
      </Card>
    </>
  );
}
