import {
  EventType,
  VenuePreference,
  TimelinePhase,
  TimelineTask,
} from '../types/planwise.ts';
import { getDaysUntil } from './formatters.ts';

/**
 * Generates dynamic preparation timeline phases and tasks
 */
export function generatePreparationTimeline(
  eventDateString: string,
  eventType: EventType,
  venuePreference: VenuePreference
): TimelinePhase[] {
  const daysUntil = getDaysUntil(eventDateString);
  const eventDate = new Date(eventDateString);

  // Helper to get ISO date string N days before event
  const getSubtractedDateStr = (daysBefore: number): string => {
    const d = new Date(eventDate);
    d.setDate(d.getDate() - daysBefore);
    return d.toISOString().split('T')[0];
  };

  const phases: TimelinePhase[] = [];

  // Phase 1: 90 to 60 Days Prior (Long-lead foundation)
  if (daysUntil >= 30 || eventType === 'wedding') {
    const isOverdue = daysUntil < 60;
    phases.push({
      id: 'phase-foundation',
      timeframe: '90 – 60 Days Prior',
      targetDaysBefore: 60,
      targetDate: getSubtractedDateStr(60),
      status: isOverdue ? (daysUntil < 45 ? 'overdue' : 'in_progress') : 'upcoming',
      tasks: [
        {
          id: 't-1',
          title: 'Finalize Event Budget & Priority Allocations',
          category: 'Planning',
          completed: false,
          priority: 'high',
          dueDate: getSubtractedDateStr(75),
        },
        {
          id: 't-2',
          title: 'Book and Pay Venue Advance Deposit',
          category: 'Venue',
          completed: false,
          priority: 'high',
          dueDate: getSubtractedDateStr(65),
        },
        {
          id: 't-3',
          title: 'Lock In Primary Caterer & Tasting Schedule',
          category: 'Catering',
          completed: false,
          priority: 'high',
          dueDate: getSubtractedDateStr(60),
        },
        {
          id: 't-4',
          title: 'Draft Master Guest List and Collect Phone/Emails',
          category: 'Guests',
          completed: false,
          priority: 'medium',
          dueDate: getSubtractedDateStr(60),
        },
      ],
    });
  }

  // Phase 2: 60 to 30 Days Prior (Vendors & Invitations)
  phases.push({
    id: 'phase-vendors',
    timeframe: '60 – 30 Days Prior',
    targetDaysBefore: 30,
    targetDate: getSubtractedDateStr(30),
    status: daysUntil < 30 ? 'overdue' : daysUntil <= 60 ? 'in_progress' : 'upcoming',
    tasks: [
      {
        id: 't-5',
        title: 'Send Digital / Physical Invitations with RSVP Link',
        category: 'Invitations',
        completed: false,
        priority: 'high',
        dueDate: getSubtractedDateStr(45),
      },
      {
        id: 't-6',
        title: 'Book Photographer & Videographer',
        category: 'Media',
        completed: false,
        priority: 'high',
        dueDate: getSubtractedDateStr(40),
      },
      {
        id: 't-7',
        title: 'Lock In DJ / Band & Sound Setup Contracts',
        category: 'Entertainment',
        completed: false,
        priority: 'medium',
        dueDate: getSubtractedDateStr(35),
      },
      {
        id: 't-8',
        title: venuePreference === 'outdoor'
          ? 'Secure Civic Sound NOC & Waterproof German Hanger Setup'
          : 'Finalize Stage Backdrop & Main Decor Specs with Florist',
        category: 'Decor & Permits',
        completed: false,
        priority: 'high',
        dueDate: getSubtractedDateStr(30),
      },
    ],
  });

  // Phase 3: 30 to 14 Days Prior (Design & Details)
  phases.push({
    id: 'phase-details',
    timeframe: '30 – 14 Days Prior',
    targetDaysBefore: 14,
    targetDate: getSubtractedDateStr(14),
    status: daysUntil < 14 ? 'overdue' : daysUntil <= 30 ? 'in_progress' : 'upcoming',
    tasks: [
      {
        id: 't-9',
        title: 'Conduct Food Tasting & Lock In Live Counter Choices',
        category: 'Catering',
        completed: false,
        priority: 'high',
        dueDate: getSubtractedDateStr(20),
      },
      {
        id: 't-10',
        title: 'Confirm Emcee / Anchor & Event Run of Show Sequence',
        category: 'Entertainment',
        completed: false,
        priority: 'medium',
        dueDate: getSubtractedDateStr(16),
      },
      {
        id: 't-11',
        title: 'Order Party Favors / Return Gifts & Custom Signage',
        category: 'Logistics',
        completed: false,
        priority: 'low',
        dueDate: getSubtractedDateStr(15),
      },
    ],
  });

  // Phase 4: 14 to 3 Days Prior (Final Headcount & Coordination)
  phases.push({
    id: 'phase-headcount',
    timeframe: '14 – 3 Days Prior',
    targetDaysBefore: 3,
    targetDate: getSubtractedDateStr(3),
    status: daysUntil < 3 ? 'overdue' : daysUntil <= 14 ? 'in_progress' : 'upcoming',
    tasks: [
      {
        id: 't-12',
        title: 'Follow Up on Pending RSVPs & Send Final Guarantee to Caterer',
        category: 'Catering',
        completed: false,
        priority: 'high',
        dueDate: getSubtractedDateStr(5),
      },
      {
        id: 't-13',
        title: 'Conduct Venue Walkthrough with Decorator & Electrician',
        category: 'Venue',
        completed: false,
        priority: 'high',
        dueDate: getSubtractedDateStr(4),
      },
      {
        id: 't-14',
        title: 'Prepare Cash Envelopes for Vendor Final Balances & Tips',
        category: 'Finance',
        completed: false,
        priority: 'medium',
        dueDate: getSubtractedDateStr(3),
      },
    ],
  });

  // Phase 5: 1 Day Prior & Day of the Event (Execution)
  phases.push({
    id: 'phase-execution',
    timeframe: '1 Day Prior & Day-Of',
    targetDaysBefore: 0,
    targetDate: eventDateString,
    status: daysUntil < 0 ? 'completed' : daysUntil <= 1 ? 'in_progress' : 'upcoming',
    tasks: [
      {
        id: 't-15',
        title: 'Drop Off Event Props, Favors & Welcome Materials at Venue',
        category: 'Logistics',
        completed: false,
        priority: 'high',
        dueDate: getSubtractedDateStr(1),
      },
      {
        id: 't-16',
        title: 'Vendor Load-In Check: Sound System & Stage Decor (T-4 Hours)',
        category: 'Coordination',
        completed: false,
        priority: 'high',
        dueDate: eventDateString,
      },
      {
        id: 't-17',
        title: 'Test Microphone, Lighting Levels & Welcome Table Checklist',
        category: 'Production',
        completed: false,
        priority: 'high',
        dueDate: eventDateString,
      },
      {
        id: 't-18',
        title: 'Welcome Guests & Enjoy the Celebration!',
        category: 'Celebration',
        completed: false,
        priority: 'high',
        dueDate: eventDateString,
      },
    ],
  });

  return phases;
}
