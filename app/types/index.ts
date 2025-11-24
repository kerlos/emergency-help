export interface HelpRequest {
  id: number;
  place_name?: string;
  phone: string;
  backup_phone?: string;
  num_people: string;
  has_elderly: boolean;
  has_children: boolean;
  has_sick: boolean;
  has_pets: boolean;
  additional_message?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  status: 'active' | 'resolved';
}

export interface HelpRequestInput {
  place_name?: string;
  phone: string;
  backup_phone?: string;
  num_people: string;
  has_elderly: boolean;
  has_children: boolean;
  has_sick: boolean;
  has_pets: boolean;
  additional_message?: string;
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

