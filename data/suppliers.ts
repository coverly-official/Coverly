// Export as named export 'supplierData' to match import in LiveDemo.tsx
export const supplierData: Array<{
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}> = [
  {
    id: '1',
    name: 'Premium Electronics',
    category: 'electronics',
    price: 299.99,
    stock: 50,
  },
  {
    id: '2',
    name: 'Budget Gadgets',
    category: 'electronics',
    price: 149.99,
    stock: 120,
  },
  {
    id: '3',
    name: 'Home Essentials',
    category: 'home',
    price: 49.99,
    stock: 75,
  },
  {
    id: '4',
    name: 'Office Supplies Co.',
    category: 'office',
    price: 24.99,
    stock: 200,
  },
  {
    id: '5',
    name: 'Fashion Forward',
    category: 'fashion',
    price: 89.99,
    stock: 30,
  },
];

// Also export as default for flexibility
export default supplierData;
