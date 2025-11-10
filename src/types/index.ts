// Course types
export interface Course {
  course_id?: string;
  name?: string;
  description?: string;
  category?: string;
  level?: string;
  duration_weeks?: number;
  price?: number;
  max_students?: number;
  current_students?: number;
  start_date?: string;
  end_date?: string;
  schedule?: string;
  status?: string;
  image_url?: string;
  center_id?: string;
  center_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Activity types
export interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  formattedAddress?: string;
  placeId?: string;
  createdAt: string;
  role?: string;
}

// Center types
export interface Center {
  centerId: string;
  name: string;
  address: string;
  phone?: string;
  status?: string;
}

// Child types
export interface Child {
  childId: string;
  fullName: string;
  schoolId: string;
  schoolName: string;
  centerId?: string;
  centerName?: string;
  grade: string;
  dateOfBirth?: string;
  status?: string;
}

// Contract types
export interface Contract {
  contractId: string;
  childId: string;
  childName: string;
  packageId: string;
  packageName: string;
  mainTutorId: string;
  mainTutorName: string;
  centerId?: string;
  centerName?: string;
  startDate: string;
  endDate: string;
  timeSlot: string;
  isOnline: boolean;
  status: string;
}

