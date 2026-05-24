import { FileImage, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "./ui/Button";
import { Input } from "./ui/Input";
import { apiUrl } from "../lib/api";

export default function UploadSection() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || busy) return;

    const formData = new FormData();
    formData.append("image", file);

    setBusy(true);
    setStatus("");
    setResult(null);

    try {
      const response = await fetch(apiUrl("/api/v1/detect/pest"), {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Upload failed.");
      }

      setResult(data);
      setStatus(data.message || "Image received.");
    } catch (error) {
      setStatus(error.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="upload" className="scroll-mt-24 bg-white/60 px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <UploadCloud className="text-brand-primary" />
            <h2 className="heading-font mt-3 text-3xl font-bold text-brand-text">Photo diagnosis</h2>
            <p className="mt-2 max-w-2xl text-sm text-brand-muted">
              Upload a crop image and send it to the detection pipeline. The backend returns a stable placeholder response
              today, ready for a real model later.
            </p>
          </div>
          <Button as="a" href="#chat" variant="outline">
            Ask AI instead
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-text">Crop image</span>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  required
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy || !file}>
                  {busy ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Analyze image"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setStatus("");
                    setResult(null);
                  }}
                  disabled={!file && !status && !result}
                >
                  Reset
                </Button>
              </div>
              {status ? <p className="text-sm text-brand-muted">{status}</p> : null}
            </form>
          </article>

          <article className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileImage className="text-brand-primary" />
              <div>
                <h3 className="heading-font text-lg font-semibold text-brand-text">Preview & result</h3>
                <p className="text-sm text-brand-muted">One shared upload flow, no extra page needed.</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-green-100 bg-green-50">
              {previewUrl ? (
                <img src={previewUrl} alt="Selected crop preview" className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-brand-muted">
                  Pick an image to see a preview and send it to the backend.
                </div>
              )}
            </div>

            {result ? (
              <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm text-brand-text">
                <p className="font-semibold">{result.status || "Result"}</p>
                <p className="mt-1 text-brand-muted">{result.message}</p>
                {Array.isArray(result.suggestedNextSteps) && result.suggestedNextSteps.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-brand-muted">
                    {result.suggestedNextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}
