import alumniData from "@/data/alumni.json";
import eventsData from "@/data/events.json";
import storiesData from "@/data/stories.json";

export type Job = {
  company: string;
  position: string;
  business_type?: string;
  industry?: string;
  city?: string;
  country?: string;
  start_year?: string;
  end_year?: string;
};

export type Alumni = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  photo?: string;
  email?: string;
  phone?: string;
  address?: string;
  province?: string;
  country?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
  other_contact?: string;
  student_id?: string;
  generation?: number;
  program_type?: "TEP" | "TEPE" | "TEPE+" | string;
  major?: string;
  admission_year?: string;
  graduation_year?: string;
  honors?: string;
  partner_university?: string;
  partner_major?: string;
  additional_bachelors?: string;
  additional_masters?: string;
  additional_phd?: string;
  masters_partner_university?: string;
  masters_partner_degree?: string;
  masters_admission_year?: string;
  masters_graduation_year?: string;
  masters_honors?: string;
  high_school?: string;
  high_school_gpax?: string;
  middle_school?: string;
  middle_school_gpax?: string;
  professional_summary?: string;
  skills?: string[];
  expertise?: string[];
  research_interests?: string;
  certifications?: string;
  jobs?: Job[];
  available_as_mentor?: boolean;
  directory_visible?: boolean;
  hidden?: boolean;
  featured?: boolean;
  featured_caption?: string;
  imported_at?: string;
};

export type EventItem = {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  content?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  banner_url?: string;
  external_url?: string;
  hidden?: boolean;
};

export type Story = {
  id: string;
  slug?: string;
  title: string;
  alumni_name: string;
  generation?: number;
  company?: string;
  summary?: string;
  content?: string;
  image_url?: string;
  external_url?: string;
  hidden?: boolean;
};

export const alumni = alumniData as Alumni[];
export const events = eventsData as EventItem[];
export const stories = storiesData as Story[];

export function visibleAlumni(): Alumni[] {
  return alumni.filter((a) => !a.hidden && a.directory_visible !== false);
}

export function findAlumni(id: string): Alumni | undefined {
  return alumni.find((a) => a.id === id);
}

export function visibleEvents(): EventItem[] {
  return events.filter((e) => !e.hidden);
}
export function findEvent(idOrSlug: string): EventItem | undefined {
  return events.find((e) => !e.hidden && (e.id === idOrSlug || e.slug === idOrSlug));
}

export function visibleStories(): Story[] {
  return stories.filter((s) => !s.hidden);
}
export function findStory(idOrSlug: string): Story | undefined {
  return stories.find((s) => !s.hidden && (s.id === idOrSlug || s.slug === idOrSlug));
}
