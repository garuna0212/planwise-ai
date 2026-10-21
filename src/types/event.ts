export type EventType =
  | 'birthday'
  | 'wedding'
  | 'anniversary'
  | 'baby_shower'
  | 'corporate'
  | 'dinner_party'
  | 'graduation'
  | 'holiday_gathering'
  | 'festival'
  | 'cocktail_party'
  | 'other';

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface MenuItem {
  name: string;
  description: string;
  tags: string[]; // e.g. "Vegan", "Gluten-Free", "Chef Special"
}

export interface DrinkItem {
  name: string;
  description: string;
  type: 'cocktail' | 'mocktail' | 'wine' | 'beverage';
  tags: string[];
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'setup' | 'arrival' | 'activity' | 'dining' | 'toast' | 'entertainment' | 'wrapup';
  completed?: boolean;
}

export interface BudgetItem {
  id: string;
  category: 'Venue' | 'Catering & Bar' | 'Decor & Florals' | 'Entertainment' | 'Photo & Video' | 'Attire & Beauty' | 'Stationery & Favors' | 'Miscellaneous';
  item: string;
  budgeted: number;
  actual: number;
  paid: boolean;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'attending' | 'declined' | 'pending';
  plusOnes: number;
  dietaryRestrictions?: string;
  tableNumber?: string;
  invitationSent?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  timeframe: '1_month_prior' | '2_weeks_prior' | '1_week_prior' | '1_day_prior' | 'day_of' | 'post_event';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  notes?: string;
}

export interface DecorIdea {
  area: string;
  suggestion: string;
  diyTip?: string;
}

export interface EntertainmentActivity {
  title: string;
  description: string;
  vibe: string;
}

export interface EventPlan {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  locationName: string;
  locationAddress?: string;
  guestCount: number;
  estimatedBudget: number;
  currency: string;
  vibeTheme: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;

  // Plan Details
  theme: {
    tagline: string;
    narrative: string;
    colorPalette: ColorSwatch[];
    dressCode: string;
    musicVibe: string;
    keyAestheticElements: string[];
  };
  timeline: TimelineItem[];
  menu: {
    appetizers: MenuItem[];
    mains: MenuItem[];
    desserts: MenuItem[];
    drinks: DrinkItem[];
    chefNotes?: string;
  };
  decorIdeas: DecorIdea[];
  entertainment: EntertainmentActivity[];
  budgetItems: BudgetItem[];
  guests: Guest[];
  tasks: TaskItem[];
}
