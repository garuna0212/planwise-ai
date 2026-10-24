export type EventType =
  | 'wedding'
  | 'birthday'
  | 'community'
  | 'anniversary'
  | 'corporate'
  | 'festival';

export type VenuePreference = 'indoor' | 'outdoor' | 'hybrid';

export interface PlanInput {
  title: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  city: string;
  budgetINR: number;
  guestCount: number;
  theme: string;
  venuePreference: VenuePreference;
  specialRequirements: string;
}

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decorations'
  | 'entertainment'
  | 'logistics'
  | 'contingency';

export interface BudgetSubItem {
  id: string;
  name: string;
  estimatedINR: number;
  actualINR: number;
  status: 'pending' | 'booked' | 'paid';
}

export interface BudgetBreakdown {
  category: BudgetCategory;
  label: string;
  percentage: number; // 0 to 100
  allocatedINR: number;
  actualSpentINR: number;
  description: string;
  isOverBudget: boolean;
  subItems: BudgetSubItem[];
}

export type WarningSeverity = 'danger' | 'warning' | 'info';

export interface PlanningWarning {
  id: string;
  severity: WarningSeverity;
  category: 'budget' | 'date' | 'weather' | 'logistics' | 'guest_capacity';
  title: string;
  message: string;
  actionableTip: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  notes?: string;
}

export interface TimelinePhase {
  id: string;
  timeframe: string;
  targetDaysBefore: number;
  targetDate: string;
  status: 'completed' | 'in_progress' | 'upcoming' | 'overdue';
  tasks: TimelineTask[];
}

export type VendorStatus =
  | 'not_contacted'
  | 'contacted'
  | 'negotiating'
  | 'booked'
  | 'completed';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid';

export interface VendorItem {
  id: string;
  category: BudgetCategory;
  serviceName: string;
  vendorName: string;
  contactPerson?: string;
  phoneOrEmail?: string;
  status: VendorStatus;
  estimatedINR: number;
  actualQuoteINR: number;
  paymentStatus: PaymentStatus;
  notes: string;
}

export interface BudgetTradeOff {
  id: string;
  area: string;
  tradeOff: string;
  impact: string;
  potentialSavingsINR: number;
  actionType: 'reduce_guests' | 'shift_catering' | 'diy_decor' | 'off_peak' | 'rebalance_entertainment';
}

export interface PlanRevisionProposal {
  id: string;
  title: string;
  rationale: string;
  changesSummary: string[];
  suggestedBudgetWeights?: Partial<Record<BudgetCategory, number>>;
  suggestedGuestCount?: number;
  suggestedTotalBudgetINR?: number;
  themeAdjustment?: string;
  specialNote?: string;
  applied: boolean;
}

export interface GeminiCreativeInsights {
  conceptNarrative: string;
  tagline: string;
  curatedMenu: {
    welcomeDrinks: string[];
    appetizers: string[];
    mains: string[];
    desserts: string[];
    culturalNotes: string;
  };
  decorAndAmbience: {
    colorPalette: { name: string; hex: string }[];
    stylingHighlights: string[];
    diyCostSavingIdeas: string[];
  };
  entertainmentAndActivities: {
    highlights: string[];
    runOfShowTips: string[];
  };
  citySpecificAdvice: string;
  whyThisFitsContext?: {
    eventTypeRationale: string;
    cityAndSeasonRationale: string;
    guestScaleRationale: string;
    budgetEfficiencyRationale: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'adjust_budget' | 'add_task' | 'add_vendor';
    payload?: any;
    label: string;
  };
  revisionProposal?: PlanRevisionProposal;
}

export interface PlanWisePlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: PlanInput;
  budget: {
    totalINR: number;
    costPerGuestINR: number;
    cateringPerGuestINR: number;
    totalAllocatedINR: number;
    totalActualSpentINR: number;
    remainingINR: number;
    isOverallOverBudget: boolean;
    categories: BudgetBreakdown[];
    contingencyAmountINR: number;
  };
  warnings: PlanningWarning[];
  timeline: TimelinePhase[];
  vendors: VendorItem[];
  aiInsights: GeminiCreativeInsights;
  chatHistory: ChatMessage[];
  assumptions: string[];
  tradeOffs: BudgetTradeOff[];
}

