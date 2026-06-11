export type PlanType = 'gratis' | 'pro';

export interface User {
  id: string; // UUID from Auth
  email: string;
  created_at: string;
  plan: PlanType;
}

export interface Category {
  id: string; // UUID
  name: string;
  color: string;
  icon: string;
}

export interface Invoice {
  id: string; // UUID
  user_id: string; // UUID references User
  rfc_emisor: string;
  nombre_emisor: string;
  fecha: string;
  total: number;
  subtotal: number;
  iva: number;
  category_id: string | null; // UUID references Category
  status: 'Vigente' | 'Cancelado';
  items?: {
    descripcion: string;
    cantidad: number;
    valor_unitario: number;
    importe: number;
  }[];
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id'>;
        Update: Partial<Omit<Category, 'id'>>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, 'id'>;
        Update: Partial<Omit<Invoice, 'id'>>;
      };
    };
  };
}
