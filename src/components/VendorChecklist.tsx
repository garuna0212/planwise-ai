import React, { useState } from 'react';
import {
  Users,
  Building,
  CheckCircle2,
  Clock,
  Phone,
  IndianRupee,
  Plus,
  Trash2,
  Edit2,
  Info,
} from 'lucide-react';
import {
  PlanWisePlan,
  VendorItem,
  VendorStatus,
  PaymentStatus,
  BudgetCategory,
} from '../types/planwise.ts';
import { formatINR } from '../utils/formatters.ts';
import { calculateVendorStats } from '../utils/vendorEngine.ts';

interface VendorChecklistProps {
  plan: PlanWisePlan;
  onUpdatePlan: (updatedPlan: PlanWisePlan) => void;
}

export const VendorChecklist: React.FC<VendorChecklistProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const stats = calculateVendorStats(plan.vendors);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<VendorItem>>({
    serviceName: '',
    vendorName: '',
    category: 'catering',
    estimatedINR: 50000,
    actualQuoteINR: 0,
    status: 'not_contacted',
    paymentStatus: 'unpaid',
    notes: '',
  });

  const handleStatusChange = (vendorId: string, status: VendorStatus) => {
    const updated = plan.vendors.map((v) =>
      v.id === vendorId ? { ...v, status } : v
    );
    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      vendors: updated,
    });
  };

  const handlePaymentChange = (vendorId: string, paymentStatus: PaymentStatus) => {
    const updated = plan.vendors.map((v) =>
      v.id === vendorId ? { ...v, paymentStatus } : v
    );
    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      vendors: updated,
    });
  };

  const handleActualQuoteChange = (vendorId: string, actualQuoteINR: number) => {
    const updated = plan.vendors.map((v) =>
      v.id === vendorId ? { ...v, actualQuoteINR: Math.max(0, actualQuoteINR || 0) } : v
    );
    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      vendors: updated,
    });
  };

  const handleVendorNameChange = (vendorId: string, vendorName: string) => {
    const updated = plan.vendors.map((v) =>
      v.id === vendorId ? { ...v, vendorName } : v
    );
    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      vendors: updated,
    });
  };

  const handleDeleteVendor = (vendorId: string) => {
    const updated = plan.vendors.filter((v) => v.id !== vendorId);
    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      vendors: updated,
    });
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.serviceName) return;

    const vendorItem: VendorItem = {
      id: `v-${Date.now()}`,
      category: (newVendor.category as BudgetCategory) || 'venue',
      serviceName: newVendor.serviceName || 'Custom Service',
      vendorName: newVendor.vendorName || 'Prospective Vendor (Estimate)',
      status: newVendor.status || 'not_contacted',
      estimatedINR: Number(newVendor.estimatedINR) || 0,
      actualQuoteINR: Number(newVendor.actualQuoteINR) || 0,
      paymentStatus: newVendor.paymentStatus || 'unpaid',
      notes: newVendor.notes || '',
    };

    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      vendors: [...plan.vendors, vendorItem],
    });

    setShowAddForm(false);
    setNewVendor({
      serviceName: '',
      vendorName: '',
      category: 'catering',
      estimatedINR: 50000,
      actualQuoteINR: 0,
      status: 'not_contacted',
      paymentStatus: 'unpaid',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Vendor Stats Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Vendor Sourcing & Progress Pipeline
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {stats.bookedCount} of {stats.totalVendors} Booked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track unverified estimated ranges vs committed actual quotes. Estimates are marked for clarity.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500">Committed Quotes:</div>
            <div className="text-base font-extrabold text-slate-900 font-mono">
              {formatINR(stats.totalActualQuotedINR)}
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Add Vendor Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddVendorSubmit}
          className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Add New Service / Vendor Requirement
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mehendi Artist / Photo Booth"
                value={newVendor.serviceName}
                onChange={(e) =>
                  setNewVendor({ ...newVendor, serviceName: e.target.value })
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Studio Name
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Henna Studio (Estimate)"
                value={newVendor.vendorName}
                onChange={(e) =>
                  setNewVendor({ ...newVendor, vendorName: e.target.value })
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={newVendor.category}
                onChange={(e) =>
                  setNewVendor({
                    ...newVendor,
                    category: e.target.value as BudgetCategory,
                  })
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="venue">Venue</option>
                <option value="catering">Catering</option>
                <option value="decorations">Decorations</option>
                <option value="entertainment">Entertainment</option>
                <option value="logistics">Logistics</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Cost (INR)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={newVendor.estimatedINR || ''}
                onChange={(e) =>
                  setNewVendor({ ...newVendor, estimatedINR: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Quoted Amount (INR)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={newVendor.actualQuoteINR || ''}
                onChange={(e) =>
                  setNewVendor({
                    ...newVendor,
                    actualQuoteINR: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Pipeline Status
              </label>
              <select
                value={newVendor.status}
                onChange={(e) =>
                  setNewVendor({
                    ...newVendor,
                    status: e.target.value as VendorStatus,
                  })
                }
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="not_contacted">Not Contacted</option>
                <option value="contacted">Contacted</option>
                <option value="negotiating">Negotiating</option>
                <option value="booked">Booked</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
          >
            Save to Vendor Checklist
          </button>
        </form>
      )}

      {/* Vendor Table for Desktop & Tablet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Service & Role</th>
                <th className="py-3 px-4">Assigned Vendor / Agency</th>
                <th className="py-3 px-4">Estimated Range</th>
                <th className="py-3 px-4">Actual Quote</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.vendors.map((vendor) => {
                const isBooked = vendor.status === 'booked' || vendor.status === 'completed';

                return (
                  <tr key={vendor.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{vendor.serviceName}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{vendor.category}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={vendor.vendorName}
                        onChange={(e) => handleVendorNameChange(vendor.id, e.target.value)}
                        className="w-full max-w-[200px] px-2 py-1 text-xs rounded border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white transition bg-transparent"
                      />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{formatINR(vendor.estimatedINR)}</div>
                      <span className="text-[10px] text-slate-400 font-sans">(Estimate)</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="relative max-w-[120px]">
                        <span className="absolute left-2 top-1 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={vendor.actualQuoteINR || ''}
                          onChange={(e) =>
                            handleActualQuoteChange(vendor.id, Number(e.target.value))
                          }
                          className="w-full pl-5 pr-2 py-1 text-xs font-mono font-semibold rounded border border-slate-200 focus:border-indigo-500 bg-white"
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={vendor.status}
                        onChange={(e) =>
                          handleStatusChange(vendor.id, e.target.value as VendorStatus)
                        }
                        className={`px-2 py-1 rounded-md text-xs font-semibold border transition ${
                          isBooked
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : vendor.status === 'negotiating'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="not_contacted">Not Contacted</option>
                        <option value="contacted">Contacted</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="booked">Booked</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={vendor.paymentStatus}
                        onChange={(e) =>
                          handlePaymentChange(vendor.id, e.target.value as PaymentStatus)
                        }
                        className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                          vendor.paymentStatus === 'fully_paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : vendor.paymentStatus === 'deposit_paid'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="deposit_paid">Deposit Paid</option>
                        <option value="fully_paid">Fully Paid</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Delete vendor item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive Mobile Cards for Vendor List */}
      <div className="space-y-3 block md:hidden">
        {plan.vendors.map((vendor) => {
          const isBooked = vendor.status === 'booked' || vendor.status === 'completed';

          return (
            <div
              key={vendor.id}
              className={`p-4 rounded-2xl bg-white border shadow-xs space-y-3 transition ${
                isBooked ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{vendor.serviceName}</h4>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {vendor.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteVendor(vendor.id)}
                  aria-label={`Delete ${vendor.serviceName}`}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={vendor.vendorName}
                  onChange={(e) => handleVendorNameChange(vendor.id, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Estimated</div>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {formatINR(vendor.estimatedINR)}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Actual Quote</div>
                  <div className="relative mt-0.5">
                    <span className="absolute left-1.5 top-0.5 text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={vendor.actualQuoteINR || ''}
                      onChange={(e) => handleActualQuoteChange(vendor.id, Number(e.target.value))}
                      className="w-full pl-4 pr-1 py-0.5 text-xs font-mono font-bold rounded border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Status</label>
                  <select
                    value={vendor.status}
                    onChange={(e) => handleStatusChange(vendor.id, e.target.value as VendorStatus)}
                    className="w-full px-2 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="not_contacted">Not Contacted</option>
                    <option value="contacted">Contacted</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Payment</label>
                  <select
                    value={vendor.paymentStatus}
                    onChange={(e) => handlePaymentChange(vendor.id, e.target.value as PaymentStatus)}
                    className="w-full px-2 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="fully_paid">Fully Paid</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
