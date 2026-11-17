import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileCheck,
  Plus,
  Printer,
  Building2,
  Calendar,
  CheckCircle,
  Truck,
  DollarSign,
  Download,
} from "lucide-react";
import { PurchaseOrder } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PurchaseOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Details Modal
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadPos = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/buyer/purchase-orders`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setPos(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPos();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Official Purchase Orders (POs)</h1>
          <p className="text-xs text-stone-500 mt-1">
            Binding legal procurement purchase orders with formal GST calculation, delivery timelines, and audit logs.
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading purchase orders...</div>
        ) : pos.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            No purchase orders issued yet. Accepting a supplier quotation or converting an approved PR generates a binding PO here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Issued Date</th>
                  <th className="p-3">Expected Delivery</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-stone-50/50">
                    <td className="p-3 font-mono font-bold text-stone-900">{po.po_number}</td>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{po.businesses?.name || "Supplier Partner"}</div>
                      <div className="text-[11px] text-stone-500">{po.delivery_city}, {po.delivery_state}</div>
                    </td>
                    <td className="p-3 text-stone-600 font-mono">
                      {new Date(po.issued_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-stone-600 font-mono">
                      {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : "Per Schedule"}
                    </td>
                    <td className="p-3 font-mono font-black text-stone-900">
                      ₹{po.total_amount?.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        po.po_status === "fulfilled"
                          ? "bg-emerald-100 text-emerald-800"
                          : po.po_status === "issued"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {po.po_status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedPo(po)}
                        className="px-3 py-1 bg-stone-900 text-white font-semibold rounded text-xs hover:bg-stone-800 inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        View PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PO Printable View Modal */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-stone-100 px-2.5 py-1 rounded">
                  {selectedPo.po_number}
                </span>
                <span className="text-xs uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  Official Purchase Order
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedPo(null)}
                  className="text-stone-400 hover:text-stone-600 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="grid grid-cols-2 gap-6 text-xs text-stone-700">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-stone-500 uppercase">Buyer Organization</div>
                <div className="font-bold text-sm text-stone-900">{selectedPo.delivery_address}</div>
                <div>{selectedPo.delivery_city}, {selectedPo.delivery_state} - {selectedPo.delivery_pincode}</div>
                <div>Payment Terms: <strong>{selectedPo.payment_terms || "Net 30 Days"}</strong></div>
              </div>

              <div className="space-y-1 text-right">
                <div className="text-[11px] font-bold text-stone-500 uppercase">Supplier Enterprise</div>
                <div className="font-bold text-sm text-stone-900">{selectedPo.businesses?.name || "Verified Supplier"}</div>
                <div>Date of Issuance: {new Date(selectedPo.issued_at).toLocaleDateString()}</div>
                <div>Expected By: {selectedPo.expected_delivery_date || "Mutually Agreed"}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {(selectedPo.purchase_order_items && selectedPo.purchase_order_items.length > 0) ? (
                    selectedPo.purchase_order_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium">{item.item_name}</td>
                        <td className="p-3 font-mono">{item.quantity} {item.unit}</td>
                        <td className="p-3 font-mono">₹{item.unit_price?.toLocaleString()}</td>
                        <td className="p-3 font-mono text-right font-bold">₹{item.total_price?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 font-medium">Standard Procurement Contract Item</td>
                      <td className="p-3 font-mono">1 Lot</td>
                      <td className="p-3 font-mono">₹{selectedPo.subtotal?.toLocaleString()}</td>
                      <td className="p-3 font-mono text-right font-bold">₹{selectedPo.subtotal?.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Cost Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">₹{selectedPo.subtotal?.toLocaleString()}</span>
                </div>
                {selectedPo.freight > 0 && (
                  <div className="flex justify-between">
                    <span>Freight / Shipping:</span>
                    <span className="font-mono">₹{selectedPo.freight?.toLocaleString()}</span>
                  </div>
                )}
                {selectedPo.gst_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Applicable GST (18%):</span>
                    <span className="font-mono">₹{selectedPo.gst_amount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-sm text-stone-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{selectedPo.total_amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Signatory Footer */}
            <div className="pt-6 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
              <div>
                Authorized Procurement Signatory: <strong className="text-stone-800">Digitally Confirmed</strong>
              </div>
              <div className="font-mono">
                System Generated via COVERLY B2B Platform
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
