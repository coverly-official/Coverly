import React, { useState } from "react";
import { FolderOpen, Upload, FileText, Download, ShieldCheck, Plus, Trash2 } from "lucide-react";

export const BuyerDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([
    {
      id: "doc-1",
      name: "Master Purchase Order — Apex Retail (PO-2026-001)",
      type: "purchase_order",
      size: "245 KB",
      uploaded_at: "2026-11-15",
      url: "#",
    },
    {
      id: "doc-2",
      name: "GSTIN Certificate & MSME Registration",
      type: "compliance",
      size: "1.2 MB",
      uploaded_at: "2026-11-12",
      url: "#",
    },
    {
      id: "doc-3",
      name: "SGS Material Test Inspection Report — Grade 304 Steel",
      type: "specification",
      size: "890 KB",
      uploaded_at: "2026-11-10",
      url: "#",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("purchase_order");
  const [docUrl, setDocUrl] = useState("");

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    setDocuments([
      {
        id: `doc-${Date.now()}`,
        name: docName.trim(),
        type: docType,
        size: "350 KB",
        uploaded_at: new Date().toISOString().split("T")[0],
        url: docUrl || "#",
      },
      ...documents,
    ]);

    setIsModalOpen(false);
    setDocName("");
    setDocUrl("");
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Procurement Document Vault</h1>
          <p className="text-xs text-stone-500 mt-1">
            Secure, access-controlled repository for purchase orders, invoices, quality certificates, and tax filings.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white font-bold rounded-lg text-xs hover:bg-stone-800 transition shadow-xs"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Stored Corporate Documents</h3>
          <span className="text-xs text-stone-500">{documents.length} Files Protected</span>
        </div>

        <div className="divide-y divide-stone-100">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">{doc.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    <span className="uppercase font-semibold">{doc.type.replace(/_/g, " ")}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>Uploaded {doc.uploaded_at}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={doc.url}
                  className="px-3 py-1 bg-stone-100 text-stone-700 font-semibold rounded text-xs hover:bg-stone-200 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  View
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1 text-stone-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Upload Procurement Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tax Invoice — National Packaging Ltd"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white"
                >
                  <option value="purchase_order">Purchase Order (PO)</option>
                  <option value="invoice">Supplier Tax Invoice</option>
                  <option value="quotation">Supplier Quotation</option>
                  <option value="delivery_note">Goods Received Note (GRN)</option>
                  <option value="compliance">Company Compliance / GSTIN</option>
                  <option value="specification">Quality Inspection Certificate</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Storage File URL</label>
                <input
                  type="url"
                  placeholder="https://4vwfw2w8.ap-southeast.insforge.app/storage/..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
