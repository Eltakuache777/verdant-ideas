"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, AlertCircle, Sparkles, Save } from "lucide-react";

import { auth } from "@/app/lib/firebase";
import { authFetch } from "@/app/lib/authFetch";
import { uploadDesignBlob } from "@/app/lib/uploadDesign";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function base64ToBlob(base64: string, contentType = "image/png") {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: contentType });
}

export default function StudioPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
  const [imageBase64, setImageBase64] = useState("");

  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Describe what you want to create first.");
      return;
    }

    setError("");
    setNotConfigured(false);
    setGenerating(true);
    setImageBase64("");

    try {
      const response = await authFetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.notConfigured) setNotConfigured(true);
        setError(data.error || "Image generation failed.");
        return;
      }

      setImageBase64(data.imageBase64);
    } catch {
      setError("Image generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAsProject() {
    const user = auth.currentUser;
    if (!user || !imageBase64) return;

    if (!projectName.trim()) {
      setError("Give the project a name before saving.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const blob = base64ToBlob(imageBase64);
      const designImageUrl = await uploadDesignBlob(blob);

      const response = await authFetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          type: "AI Generated",
          description: prompt,
          designImageUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      router.push("/dashboard/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this as a project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="AI Studio"
        title="Verdant Forge"
        description="Describe an idea and generate a design you can send to manufacturing."
      />

      {notConfigured ? (
        <Card className="flex flex-col items-center gap-4 px-8 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Wand2 className="h-7 w-7" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">The Forge isn&apos;t connected yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              AI generation needs an <code className="rounded bg-black/5 px-1.5 py-0.5">OPENAI_API_KEY</code> in
              the environment. Once that&apos;s added, this page generates real images.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-8">
            <Label>Describe your idea</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="A minimalist mountain logo in forest green, vector style, for a trail running jacket…"
            />

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handleGenerate} disabled={generating} className="mt-4 w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Generating…" : "Generate design"}
            </Button>
          </Card>

          <Card className="flex flex-col p-8">
            {imageBase64 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${imageBase64}`}
                  alt="Generated design"
                  className="w-full rounded-xl border border-black/10 object-cover"
                />

                <div className="mt-5 space-y-3">
                  <Label>Save as a new project</Label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Project name"
                  />
                  <Button onClick={handleSaveAsProject} disabled={saving} variant="secondary" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving…" : "Save as project"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-ink-500/60">
                <Wand2 className="h-8 w-8" strokeWidth={1.5} />
                <p className="text-sm">Your generated design will appear here.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
