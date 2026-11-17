import React, { useEffect, useState } from "react";
import { ListOrdered, Plus, Trash2, ArrowRight, FileText, CheckCircle, Package } from "lucide-react";
import { RetailerPurchaseList, RetailerPurchaseListItem } from "@/types";

export const RetailerPurchaseListsPage: React.FC = () => {
  const [lists, setLists] = useState<RetailerPurchaseList[]>([]);
  const [selectedList, setSelectedList] = useState<RetailerPurchaseList | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showRfqModal, setShowRfqModal] = useState(false);

  // New list form
  const [newListTitle, setNewListTitle] = useState("");
  const [newListCategory, setNewListCategory] = useState("grocery_fmcg");
  const [newListNotes, setNewListNotes] = useState("");
  const [newListRecurring, setNewListRecurring] = useState(false);

  // New item form
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState<number | string>(100);
  const [itemUnit, setItemUnit] = useState("kg");
  const [itemTargetPrice, setItemTargetPrice] = useState<number | string>("");

  // Convert to RFQ form
  const [deliveryCity, setDeliveryCity] = useState("Nashik");
  const [deliveryPincode, setDeliveryPincode] = useState("422001");
  const [converting, setConverting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/purchase-lists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLists(json.data);
        if (json.data.length > 0) {
          setSelectedList(json.data[0]);
        }
      }
    } catch (err) {
      console.error("Load purchase lists error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/purchase-lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newListTitle,
          category: newListCategory,
          notes: newListNotes,
          is_recurring: newListRecurring,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setNewListTitle("");
        setNewListNotes("");
        setNewListRecurring(false);
        loadLists();
      }
    } catch (err) {
      console.error("Create purchase list error:", err);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedList) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/retailer/purchase-lists/${selectedList.id}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: itemName,
          quantity: Number(itemQty),
          unit: itemUnit,
          target_unit_price: itemTargetPrice ? Number(itemTargetPrice) : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddItemModal(false);
        setItemName("");
        setItemQty(100);
        setItemTargetPrice("");
        loadLists();
      }
    } catch (err) {
      console.error("Add item error:", err);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!selectedList) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/retailer/purchase-lists/${selectedList.id}/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        loadLists();
      }
    } catch (err) {
      console.error("Remove item error:", err);
    }
  }

  async function handleConvertToRfq(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedList) return;
    setConverting(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/retailer/purchase-lists/${selectedList.id}/convert-to-rfq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          delivery_city: deliveryCity,
          delivery_pincode: deliveryPincode,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg({
          text: `RFQ ${json.data.rfq_number} generated successfully with ${json.data.items_count} items! Dispatched to matching wholesalers.`,
        });
        setShowRfqModal(false);
      } else {
        setStatusMsg({ text: json.error || "Failed to convert into RFQ.", isError: true });
      }
    } catch {
      setStatusMsg({ text: "Error converting list to RFQ.", isError: true });
    } finally {
      setConverting(false);
    }
  }

  // Active items in selected list
  const activeItems = selectedList?.retailer_purchase_list_items || [];
  const estimatedSubtotal = activeItems.reduce(
    (acc, it) => acc + (it.target_unit_price ? it.target_unit_price * it.quantity : 0),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <ListOrdered className="w-6 h-6 text-emerald-700" />
            Wholesale Sourcing Purchase Lists
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Build multi-product procurement checklists, specify replenishment volumes, and convert lists directly to multi-vendor RFQs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Sourcing List
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            statusMsg.isError
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-stone-500 text-xs">Loading sourcing lists...</div>
      ) : lists.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-200 p-12 text-center">
          <ListOrdered className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900">No Purchase Lists Yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            Prepare your store's replenishment checklist (e.g., 100kg Rice, 50kg Sugar, 20L Oil) and request competitive wholesale quotes with one click.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium"
          >
            Create First Sourcing List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List Sidebar */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 shadow-sm">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Your Sourcing Lists ({lists.length})
            </h2>

            <div className="space-y-1.5">
              {lists.map((l) => {
                const isSelected = selectedList?.id === l.id;
                const count = l.retailer_purchase_list_items?.length || 0;
                return (
                  <button
                    key={l.id}
                    onClick={() => setSelectedList(l)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition border ${
                      isSelected
                        ? "bg-emerald-950 text-white border-emerald-950 shadow-sm"
                        : "bg-stone-50/70 hover:bg-stone-100 text-stone-800 border-stone-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate">{l.title}</span>
                      {l.is_recurring && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                          isSelected ? "bg-emerald-800 text-emerald-100" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          Recurring
                        </span>
                      )}
                    </div>
                    <div className={`mt-1 flex items-center justify-between text-[11px] ${
                      isSelected ? "text-emerald-300" : "text-stone-500"
                    }`}>
                      <span>{count} items</span>
                      <span className="capitalize">{l.category?.replace("_", " ") || "General"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected List Details & Items */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-6">
            {selectedList && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">{selectedList.title}</h2>
                    {selectedList.notes && (
                      <p className="text-xs text-stone-500 mt-0.5">{selectedList.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                    <button
                      onClick={() => setShowRfqModal(true)}
                      disabled={activeItems.length === 0}
                      className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Convert to RFQ
                    </button>
                  </div>
                </div>

                {/* Items Table */}
                {activeItems.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
                    <Package className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-stone-700">No items added to this list yet.</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Click "Add Item" to add products you wish to order.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">Required Qty</th>
                          <th className="py-2.5 px-3">Target Unit Price</th>
                          <th className="py-2.5 px-3">Est. Line Total</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {activeItems.map((item) => {
                          const lineTotal = item.target_unit_price
                            ? item.target_unit_price * item.quantity
                            : null;
                          return (
                            <tr key={item.id} className="hover:bg-stone-50/60">
                              <td className="py-3 px-3 font-semibold text-stone-900">
                                {item.product_name}
                              </td>
                              <td className="py-3 px-3">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-3 px-3 text-stone-600">
                                {item.target_unit_price ? `₹${item.target_unit_price}` : "—"}
                              </td>
                              <td className="py-3 px-3 font-semibold text-stone-900">
                                {lineTotal ? `₹${lineTotal.toLocaleString("en-IN")}` : "—"}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-stone-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {estimatedSubtotal > 0 && (
                      <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between items-center text-xs">
                        <span className="font-semibold text-stone-600">Estimated Target Sourcing Budget:</span>
                        <span className="font-bold text-stone-900 text-sm">
                          ₹{estimatedSubtotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900">New Wholesale Purchase List</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">List Title *</label>
                <input
                  type="text"
                  required
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="e.g. Weekly Kirana Restock"
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Category</label>
                <select
                  value={newListCategory}
                  onChange={(e) => setNewListCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="grocery_fmcg">Grocery & FMCG</option>
                  <option value="electronics">Electronics & Accessories</option>
                  <option value="fashion_garments">Fashion & Garments</option>
                  <option value="hardware_construction">Hardware & Construction</option>
                  <option value="general_retail">General Retail</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={newListNotes}
                  onChange={(e) => setNewListNotes(e.target.value)}
                  placeholder="e.g. Prefer 30kg packaging bags for easy retail handling."
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newListRecurring}
                  onChange={(e) => setNewListRecurring(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-600"
                />
                <label htmlFor="recurring" className="text-xs text-stone-700 font-medium">
                  Recurring / Regular Purchase List
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900">Add Item to Purchase List</h2>
              <button onClick={() => setShowAddItemModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Basmati Rice 1121 Steam"
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Required Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Unit</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal</option>
                    <option value="tin">Tin</option>
                    <option value="carton">Carton / Box</option>
                    <option value="litre">Litre</option>
                    <option value="piece">Piece (pc)</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Target Unit Price (Optional)</label>
                <input
                  type="number"
                  value={itemTargetPrice}
                  onChange={(e) => setItemTargetPrice(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to RFQ Modal */}
      {showRfqModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900">Broadcast Wholesale RFQ</h2>
              <button onClick={() => setShowRfqModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600">
              This will convert all <strong>{activeItems.length} items</strong> in "
              {selectedList?.title}" into a live Request for Quotation dispatched to verified wholesalers and manufacturers.
            </p>

            <form onSubmit={handleConvertToRfq} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery Destination City *</label>
                <input
                  type="text"
                  required
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Destination Pincode *</label>
                <input
                  type="text"
                  required
                  value={deliveryPincode}
                  onChange={(e) => setDeliveryPincode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowRfqModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {converting ? "Submitting RFQ..." : "Broadcast Wholesale RFQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
