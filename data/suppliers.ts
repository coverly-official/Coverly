export interface Supplier {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
}

export const suppliers: Supplier[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    logoUrl: '/logos/techcorp.png',
    description: 'Leading provider of enterprise software solutions with over 15 years of experience.',
    products: [
      {
        id: 'p1',
        name: 'Enterprise CRM Suite',
        price: 299.99,
        image: '/products/crm-suite.png',
        rating: 4.8,
        reviews: 342
      },
      {
        id: 'p2',
        name: 'Cloud Analytics Platform',
        price: 199.99,
        image: '/products/analytics.png',
        rating: 4.6,
        reviews: 218
      }
    ]
  },
  {
    id: '2',
    name: 'DataFlow Systems',
    logoUrl: '/logos/dataflow.png',
    description: 'Specialized in data integration and business intelligence tools.',
    products: [
      {
        id: 'p3',
        name: 'Data Integration Pro',
        price: 499.99,
        image: '/products/integration.png',
        rating: 4.7,
        reviews: 156
      },
      {
        id: 'p4',
        name: 'BI Dashboard Builder',
        price: 349.99,
        image: '/products/bi-dashboard.png',
        rating: 4.5,
        reviews: 289
      }
    ]
  },
  {
    id: '3',
    name: 'SecureNet Technologies',
    logoUrl: '/logos/securenet.png',
    description: 'Cybersecurity and network protection solutions for modern enterprises.',
    products: [
      {
        id: 'p5',
        name: 'Security Monitoring Suite',
        price: 599.99,
        image: '/products/security-monitor.png',
        rating: 4.9,
        reviews: 421
      },
      {
        id: 'p6',
        name: 'Network Firewall Pro',
        price: 399.99,
        image: '/products/firewall.png',
        rating: 4.7,
        reviews: 312
      }
    ]
  }
];

export const getProductsBySupplier = (supplierId: string): Product[] => {
  return suppliers
    .find(s => s.id === supplierId)?.products || [];
};

export const getAllProducts = (): Product[] => {
  return suppliers.flatMap(s => s.products);
};
