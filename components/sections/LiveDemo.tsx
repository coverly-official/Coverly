import React, { useState } from 'react';
import { supplierData } from '@/data/suppliers';

interface SupplierItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const LiveDemo: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // Get unique categories from supplier data with defensive check
  const categories = Array.isArray(supplierData) 
    ? Array.from(new Set(supplierData.map((item) => item.category).filter(Boolean)))
    : ['all'];

  // Filter suppliers by category with defensive check
  const filteredSuppliers = Array.isArray(supplierData)
    ? supplierData.filter((item) => {
        if (selectedCategory === 'all') return true;
        return item.category === selectedCategory;
      })
    : [];

  // Get a single supplier by ID with defensive check
  const getSupplierById = (id: string): SupplierItem | undefined => {
    if (!Array.isArray(supplierData)) return undefined;
    return supplierData.find((item) => item.id === id);
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Reset selected supplier when category changes
    setSelectedSupplier(null);
  };

  // Handle supplier selection
  const handleSupplierSelect = (supplier: SupplierItem) => {
    setSelectedSupplier(supplier);
  };

  return (
    <div className="live-demo-container">
      <h2>Live Demo - Supplier Selection</h2>
      
      {/* Category Filter */}
      <div className="category-filter">
        <label htmlFor="category-select">Category:</label>
        <select 
          id="category-select"
          value={selectedCategory}
          onChange={(e) => handleCategorySelect(e.target.value)}
          className="category-select"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Supplier List */}
      <div className="supplier-list">
        <h3>Available Suppliers ({filteredSuppliers.length})</h3>
        {Array.isArray(filteredSuppliers) && filteredSuppliers.length > 0 ? (
          <ul className="supplier-items">
            {filteredSuppliers.map((supplier) => (
              <li 
                key={supplier.id}
                onClick={() => handleSupplierSelect(supplier)}
                className={`supplier-item ${selectedSupplier?.id === supplier.id ? 'selected' : ''}`}
              >
                <span className="supplier-name">{supplier.name}</span>
                <span className="supplier-price">${supplier.price.toFixed(2)}</span>
                <span className="supplier-stock">Stock: {supplier.stock}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-suppliers">No suppliers available in this category.</p>
        )}
      </div>

      {/* Selected Supplier Details */}
      {selectedSupplier && (
        <div className="selected-supplier-details">
          <h3>Selected Supplier</h3>
          <div className="supplier-info">
            <p><strong>Name:</strong> {selectedSupplier.name}</p>
            <p><strong>ID:</strong> {selectedSupplier.id}</p>
            <p><strong>Category:</strong> {selectedSupplier.category}</p>
            <p><strong>Price:</strong> ${selectedSupplier.price.toFixed(2)}</p>
            <p><strong>Stock:</strong> {selectedSupplier.stock}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedSupplier && filteredSuppliers.length > 0 && (
        <p className="no-selection">Select a supplier from the list above.</p>
      )}
    </div>
  );
};

export default LiveDemo;
