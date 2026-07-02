export interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'evening_snacks' | 'dinner';
  item_name: string;
  description: string;
  time_start?: string;
  time_end?: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  menu_item_id: string;
  rating: number | null;
  ate: boolean;
  comment: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string | null;
  title: string;
  category: 'Food Quality' | 'Hygiene' | 'Service' | 'Other';
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
  updated_at: string;
}
