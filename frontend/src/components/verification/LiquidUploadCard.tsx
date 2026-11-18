import React, { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Trash2,
  Shield,
  Image as ImageIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface UploadedKycDoc {
  id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  upload_status: string;
  created_at?: string;
}

interface LiquidUploadCardProps {
  documentType: string;
  documentLabel: string;
  allowedExtensions: string[];
  maxSizeMb: number;
  businessId?: string | null;
  existingDocument?: UploadedKycDoc | null;
  disabled?: boolean;
  onUploaded: (doc: UploadedKycDoc) => void;
  onRemoved?: (docId: string) => void;
}

type UploadPhase = "idle" | "uploading" | "verifying" | "success" | "error";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const LiquidUploadCard: React.FC<LiquidUploadCardProps> = ({
  documentType,
  documentLabel,
  allowedExtensions,
  maxSizeMb,
  businessId,
  existingDocument,
  disabled = false,
  onUploaded,
  onRemoved,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [phase, setPhase] = useState<UploadPhase>(existingDocument ? "success" : "idle");
  const [progress, setProgress] = useState<number>(existingDocument ? 100 : 0);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [uploadedBytes, setUploadedBytes] = useState<number>(existingDocument?.file_size_bytes || 0);
  const [totalBytes, setTotalBytes] = useState<number>(existingDocument?.file_size_bytes || 0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedKycDoc | null>(existingDocument || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  // Sync external existingDocument updates
  useEffect(() => {
    if (existingDocument && (!uploadedDoc || uploadedDoc.id !== existingDocument.id)) {
      setUploadedDoc(existingDocument);
      setPhase("success");
      setProgress(100);
      setUploadedBytes(existingDocument.file_size_bytes || 0);
      setTotalBytes(existingDocument.file_size_bytes || 0);
    }
  }, [existingDocument]);

  // Clean up object preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (xhrRef.current) xhrRef.current.abort();
    };
  }, [previewUrl]);

  const acceptAttr = allowedExtensions.map((ext) => `.${ext.replace(/^\./, "")}`).join(",");

  const startUpload = (file: File) => {
    setErrorMessage(null);

    // Client-side pre-check (server enforces authoritative magic-bytes + MIME + size validation)
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size <= 0) {
      setPhase("error");
      setErrorMessage("Selected file is empty (0 bytes).");
      return;
    }
    if (file.size > maxBytes) {
      setPhase("error");
      setErrorMessage(
        `File is ${formatBytes(file.size)}, which exceeds the ${maxSizeMb} MB limit for ${documentLabel}.`
      );
      return;
    }
    const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "" : "";
    if (!allowedExtensions.map((e) => e.toLowerCase()).includes(ext)) {
      setPhase("error");
      setErrorMessage(
        `Unsupported file type ".${ext || "unknown"}". Allowed formats: ${allowedExtensions.join(", ").toUpperCase()}.`
      );
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    setSelectedFile(file);
    setTotalBytes(file.size);
    setUploadedBytes(0);
    setProgress(0);
    setIndeterminate(false);
    setPhase("uploading");

    const userId = localStorage.getItem("coverly_user_id") || "";
    const token = localStorage.getItem("auth_token") || "";

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open("POST", `${API_BASE}/kyc/upload`, true);
    if (userId) xhr.setRequestHeader("x-user-id", userId);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-kyc-document-type", documentType);
    xhr.setRequestHeader("x-kyc-filename", encodeURIComponent(file.name));
    xhr.setRequestHeader("x-kyc-mime-type", file.type || "application/octet-stream");
    if (businessId) xhr.setRequestHeader("x-kyc-business-id", businessId);

    // Genuine XHR transport upload progress (zero fake timers)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        setIndeterminate(false);
        const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setUploadedBytes(event.loaded);
        setTotalBytes(event.total);
        setProgress(pct);
        if (event.loaded >= event.total) {
          setPhase("verifying");
        }
      } else {
        setIndeterminate(true);
      }
    };

    xhr.onload = () => {
      xhrRef.current = null;
      let parsed: any = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        parsed = null;
      }

      const returnedDoc = parsed?.data?.document || parsed?.data;
      if (xhr.status >= 200 && xhr.status < 300 && parsed?.success && returnedDoc?.id) {
        const doc: UploadedKycDoc = returnedDoc;
        setUploadedDoc(doc);
        setProgress(100);
        setUploadedBytes(file.size);
        setIndeterminate(false);
        setPhase("success");
        onUploaded(doc);
      } else {
        setPhase("error");
        setIndeterminate(false);
        setErrorMessage(
          parsed?.error ||
            parsed?.message ||
            (xhr.status === 413
              ? "File exceeds server upload size limit."
              : `Upload failed (HTTP ${xhr.status}). Please retry.`)
        );
      }
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setPhase("error");
      setIndeterminate(false);
      setErrorMessage("Network error interrupted the upload. Check your connection and retry.");
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      setPhase(uploadedDoc ? "success" : "idle");
      setProgress(uploadedDoc ? 100 : 0);
      setIndeterminate(false);
      setErrorMessage("Upload cancelled.");
    };

    xhr.send(file);
  };

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const handleRetry = () => {
    if (selectedFile) {
      startUpload(selectedFile);
    } else {
      inputRef.current?.click();
    }
  };

  const handleRemove = async () => {
    if (!uploadedDoc) {
      setSelectedFile(null);
      setPhase("idle");
      setProgress(0);
      setErrorMessage(null);
      return;
    }
    setIsRemoving(true);
    try {
      const userId = localStorage.getItem("coverly_user_id") || "";
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`${API_BASE}/kyc/documents/${uploadedDoc.id}`, {
        method: "DELETE",
        headers: {
          ...(userId ? { "x-user-id": userId } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setErrorMessage(body.error || "Unable to remove document. It may already be linked to a submission.");
      } else {
        const removedId = uploadedDoc.id;
        setUploadedDoc(null);
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPhase("idle");
        setProgress(0);
        setErrorMessage(null);
        onRemoved?.(removedId);
      }
    } catch {
      setErrorMessage("Network error while removing document.");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || phase === "uploading" || phase === "verifying") return;
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  };

  const fillHeightPercent = phase === "idle" ? 0 : indeterminate ? 48 : progress;

  return (
    <div
      className={`relative rounded-xl border transition-all overflow-hidden bg-white ${
        phase === "error"
          ? "border-red-300 ring-1 ring-red-100"
          : phase === "success"
          ? "border-emerald-300 ring-1 ring-emerald-50"
          : isDragging
          ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20"
          : "border-stone-200 hover:border-stone-300"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && phase !== "uploading") setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Inline keyframes respecting prefers-reduced-motion */}
      <style>{`
        @keyframes coverlyLiquidWaveA {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes coverlyLiquidWaveB {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes coverlyBubbleRise {
          0% { transform: translateY(18px) scale(0.7); opacity: 0; }
          30% { opacity: 0.45; }
          100% { transform: translateY(-48px) scale(1.1); opacity: 0; }
        }
        .coverly-wave-a { animation: coverlyLiquidWaveA 3.2s linear infinite; }
        .coverly-wave-b { animation: coverlyLiquidWaveB 4.8s linear infinite; }
        .coverly-bubble-1 { animation: coverlyBubbleRise 2.4s ease-in infinite; }
        .coverly-bubble-2 { animation: coverlyBubbleRise 3.1s ease-in 0.7s infinite; }
        .coverly-bubble-3 { animation: coverlyBubbleRise 2.8s ease-in 1.4s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .coverly-wave-a, .coverly-wave-b, .coverly-bubble-1, .coverly-bubble-2, .coverly-bubble-3 {
            animation: none !important;
          }
        }
      `}</style>

      {/* Liquid-Fill Animated Surface Layer */}
      {(phase === "uploading" || phase === "verifying" || phase === "success") && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-300 ease-out"
          style={{ height: `${fillHeightPercent}%` }}
        >
          {/* Animated dual SVG waves along top meniscus */}
          {phase !== "success" && (
            <div className="absolute -top-3.5 left-0 w-full h-4 overflow-hidden">
              <svg
                viewBox="0 0 240 16"
                preserveAspectRatio="none"
                className="w-[200%] h-full coverly-wave-a"
              >
                <path
                  d="M0,8 C20,2 40,14 60,8 C80,2 100,14 120,8 C140,2 160,14 180,8 C200,2 220,14 240,8 L240,16 L0,16 Z"
                  fill="rgba(16, 185, 129, 0.22)"
                />
              </svg>
              <svg
                viewBox="0 0 240 16"
                preserveAspectRatio="none"
                className="w-[200%] h-full -mt-4 coverly-wave-b"
              >
                <path
                  d="M0,10 C25,15 45,3 70,10 C95,15 115,3 140,10 C165,15 185,3 210,10 C225,14 235,11 240,10 L240,16 L0,16 Z"
                  fill="rgba(5, 150, 105, 0.16)"
                />
              </svg>
            </div>
          )}

          {/* Liquid body gradient */}
          <div
            className={`w-full h-full ${
              phase === "success"
                ? "bg-gradient-to-t from-emerald-500/12 via-emerald-400/8 to-emerald-300/5"
                : "bg-gradient-to-t from-emerald-600/20 via-emerald-500/14 to-emerald-400/10"
            }`}
          />

          {/* Subtle rising bubbles during active upload */}
          {(phase === "uploading" || phase === "verifying") && (
            <div className="absolute inset-0 overflow-hidden">
              <span className="coverly-bubble-1 absolute bottom-2 left-[22%] w-2 h-2 rounded-full bg-emerald-500/35" />
              <span className="coverly-bubble-2 absolute bottom-1 left-[54%] w-1.5 h-1.5 rounded-full bg-emerald-600/30" />
              <span className="coverly-bubble-3 absolute bottom-3 left-[78%] w-2.5 h-2.5 rounded-full bg-emerald-400/30" />
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Upload ${documentLabel}`}
      />

      {/* Foreground Card Content */}
      <div className="relative z-10 p-4">
        {phase === "idle" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900">
                  Drag &amp; drop or choose {documentLabel}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Accepted: {allowedExtensions.join(", ").toUpperCase()} &middot; Max {maxSizeMb} MB &middot; Private encrypted storage
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              Select File
            </button>
          </div>
        )}

        {(phase === "uploading" || phase === "verifying") && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/90 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {selectedFile?.name || documentLabel}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    {phase === "verifying"
                      ? "Validating file signature & securing in private vault..."
                      : indeterminate
                      ? "Uploading securely..."
                      : `Uploading ${formatBytes(uploadedBytes)} of ${formatBytes(totalBytes)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold tabular-nums text-emerald-800">
                  {indeterminate ? "..." : `${progress}%`}
                </span>
                <button
                  type="button"
                  onClick={handleCancel}
                  title="Cancel upload"
                  className="p-1.5 rounded-lg bg-white/90 border border-stone-200 text-stone-600 hover:text-red-700 hover:border-red-200 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Precision progress hairline */}
            <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden border border-emerald-200/70">
              <div
                className="h-full bg-emerald-600 rounded-full transition-[width] duration-200"
                style={{ width: indeterminate ? "55%" : `${progress}%` }}
              />
            </div>
          </div>
        )}

        {phase === "success" && uploadedDoc && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={uploadedDoc.original_filename}
                    className="w-full h-full object-cover"
                  />
                ) : uploadedDoc.mime_type?.startsWith("image/") ? (
                  <ImageIcon className="w-5 h-5 text-emerald-700" />
                ) : (
                  <FileText className="w-5 h-5 text-emerald-700" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {uploadedDoc.original_filename}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-stone-600 mt-0.5">
                  <span>{formatBytes(uploadedDoc.file_size_bytes)}</span>
                  <span>&middot;</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <Shield className="w-3 h-3" />
                    Uploaded &amp; Signature Verified
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                disabled={disabled || isRemoving}
                onClick={handleRemove}
                title="Remove unsubmitted document"
                className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-red-50 hover:border-red-200 text-stone-500 hover:text-red-700 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800">Upload Failed</p>
                <p className="text-[11px] text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-semibold transition cursor-pointer"
              >
                Choose Another
              </button>
            </div>
          </div>
        )}

        {errorMessage && phase !== "error" && (
          <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};
