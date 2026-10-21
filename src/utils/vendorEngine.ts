import {
  BudgetBreakdown,
  EventType,
  VendorItem,
} from '../types/planwise.ts';

export function generateInitialVendors(
  categories: BudgetBreakdown[],
  eventType: EventType
): VendorItem[] {
  const findCatAlloc = (cat: string) =>
    categories.find((c) => c.category === cat)?.allocatedINR || 0;

  const venueAlloc = findCatAlloc('venue');
  const cateringAlloc = findCatAlloc('catering');
  const decorAlloc = findCatAlloc('decorations');
  const entAlloc = findCatAlloc('entertainment');
  const logAlloc = findCatAlloc('logistics');

  return [
    {
      id: 'v-1',
      category: 'venue',
      serviceName: 'Banquet Hall / Lawn Booking',
      vendorName: 'Venue Coordinator (Estimate)',
      status: 'not_contacted',
      estimatedINR: Math.round(venueAlloc * 0.85),
      actualQuoteINR: 0,
      paymentStatus: 'unpaid',
      notes: 'Verify air-conditioning backup, bridal changing room access, and midnight sound cutoff rules.',
    },
    {
      id: 'v-2',
      category: 'catering',
      serviceName: 'Food & Live Counter Catering Service',
      vendorName: 'Master Caterer (Estimate)',
      status: 'not_contacted',
      estimatedINR: Math.round(cateringAlloc * 0.8),
      actualQuoteINR: 0,
      paymentStatus: 'unpaid',
      notes: 'Request detailed per-plate menu tasting and clarify if mineral water bottles & ice are included.',
    },
    {
      id: 'v-3',
      category: 'decorations',
      serviceName: 'Stage, Mandap & Floral Decor',
      vendorName: 'Creative Floral Studio (Estimate)',
      status: 'not_contacted',
      estimatedINR: Math.round(decorAlloc * 0.75),
      actualQuoteINR: 0,
      paymentStatus: 'unpaid',
      notes: 'Share reference moodboard images for stage backdrop and request artificial vs fresh flower price options.',
    },
    {
      id: 'v-4',
      category: 'entertainment',
      serviceName: eventType === 'wedding' ? 'Sound System, DJ & Dhol Artists' : 'DJ & Audio Console Setup',
      vendorName: 'Sound & DJ Crew (Estimate)',
      status: 'not_contacted',
      estimatedINR: Math.round(entAlloc * 0.65),
      actualQuoteINR: 0,
      paymentStatus: 'unpaid',
      notes: 'Check speaker wattage suitable for venue capacity and provide playlist do-not-play list.',
    },
    {
      id: 'v-5',
      category: 'entertainment',
      serviceName: 'Candid Photography & Highlights Video',
      vendorName: 'Lens & Moments Media (Estimate)',
      status: 'not_contacted',
      estimatedINR: Math.round(entAlloc * 0.35 + venueAlloc * 0.15),
      actualQuoteINR: 0,
      paymentStatus: 'unpaid',
      notes: 'Confirm delivery timeline for raw files and processed 3-minute highlight cinematic reel.',
    },
    {
      id: 'v-6',
      category: 'logistics',
      serviceName: 'Valet Parking, Generator Backup & Security',
      vendorName: 'Logistics Operations Lead (Estimate)',
      status: 'not_contacted',
      estimatedINR: Math.round(logAlloc * 0.7),
      actualQuoteINR: 0,
      paymentStatus: 'unpaid',
      notes: 'Ensure 65 kVA silent generator backup and parking stencils for VIP guest parking.',
    },
  ];
}

export function calculateVendorStats(vendors: VendorItem[]) {
  const totalVendors = vendors.length;
  const bookedCount = vendors.filter((v) => v.status === 'booked' || v.status === 'completed').length;
  const inProgressCount = vendors.filter((v) => v.status === 'contacted' || v.status === 'negotiating').length;
  const notContactedCount = vendors.filter((v) => v.status === 'not_contacted').length;

  const totalEstimatedINR = vendors.reduce((sum, v) => sum + v.estimatedINR, 0);
  const totalActualQuotedINR = vendors.reduce((sum, v) => sum + (v.actualQuoteINR || 0), 0);
  const fullyPaidCount = vendors.filter((v) => v.paymentStatus === 'fully_paid').length;
  const depositPaidCount = vendors.filter((v) => v.paymentStatus === 'deposit_paid').length;

  return {
    totalVendors,
    bookedCount,
    inProgressCount,
    notContactedCount,
    totalEstimatedINR,
    totalActualQuotedINR,
    fullyPaidCount,
    depositPaidCount,
    progressPercentage: totalVendors > 0 ? Math.round((bookedCount / totalVendors) * 100) : 0,
  };
}
