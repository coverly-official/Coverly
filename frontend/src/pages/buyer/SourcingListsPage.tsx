import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ListOrdered, Plus, Trash2, FolderPlus, Building2, Package, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SourcingListsPage: React.FC = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New List Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Packaging");

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  // Simulated / Local fetch until DB items added
  useEffect(() => {
    setIsLoading(false);
    setLists([
      {
        id: "list-1",
        title: "Q3 Flexible Packaging Sourcing",
        description: "Stand-up pouches and rollstock films for food products",
        category: "Packaging Materials",
        itemCount: 4,
      },
      {
        id: "list-2",
        title: "Agricultural Commodity Stockists",
        description: "Direct mill basmati rice and organic spice exporters",
        category: "Agricultural Commodities",
        itemCount: 3,
      },
    ]);
  }, [user]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newList = {
      id: `list-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      itemCount: 0,
    };
    setLists([newList, ...lists]);
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
  };

  const handleDelete = (id: string) => {
    setLists(lists.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Sourcing Lists</h1>
          <p className="text-xs text-stone-500 mt-1">
            Organize suppliers, raw materials, and components into dedicated project folders for repeat procurement.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition shadow-xs"
        >
          <FolderPlus className="w-4 h-4" />
          Create Sourcing List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <ListOrdered className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-800">No custom sourcing lists created yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Group your preferred suppliers and products into procurement projects (e.g. 'Rice Millers', 'Bottle Converters') for fast RFQs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((l) => (
            <div key={l.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                    {l.category}
                  </span>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="text-stone-400 hover:text-rose-600 p-1"
                    title="Delete list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="mt-2.5 text-base font-bold text-stone-900">{l.title}</h3>
                {l.description && (
                  <p className="text-xs text-stone-600 mt-1">{l.description}</p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="text-xs text-stone-500">
                  <strong className="text-stone-800">{l.itemCount}</strong> items saved
                </span>
                <Link
                  to={`/buyer/rfq/new?title=${encodeURIComponent(l.title)}`}
                  className="px-3 py-1.5 bg-stone-900 text-white font-bold rounded-lg text-xs hover:bg-stone-800 flex items-center gap-1"
                >
                  Broadcast RFQ
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New List */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Create Procurement Sourcing List</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">List Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corrugated Box Manufacturers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Purpose of this procurement project..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
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
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
