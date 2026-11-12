import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, ShoppingBag, Tag, ChevronRight, User } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);

  // New Customer Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get(`/customers?search=${search}`);
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const viewCustomer = async (cust) => {
    setSelectedCustomer(cust);
    try {
      const { data } = await api.get(`/customers/${cust._id}`);
      if (data.success) {
        setCustomerOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/customers', {
        name: newName,
        email: newEmail,
        phone: newPhone,
      });
      if (data.success) {
        setIsNewCustModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        fetchCustomers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500">
            Customers available for AI account retrieval and support operations.
          </p>
        </div>

        <button
          onClick={() => setIsNewCustModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, email, or ID..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Customer ID</th>
                <th className="py-3 px-6">Contact</th>
                <th className="py-3 px-6">Tags</th>
                <th className="py-3 px-6">Orders</th>
                <th className="py-3 px-6">Total Spent</th>
                <th className="py-3 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                      {c.name?.[0]}
                    </div>
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600">
                    {c.customerId}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    <div>{c.email}</div>
                    <div className="text-[11px] text-slate-400">{c.phone || 'No phone'}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex flex-wrap gap-1">
                      {c.tags?.map((t, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    {c.totalOrders || 0}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    ${c.totalSpent?.toFixed(2) || '0.00'}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => viewCustomer(c)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer: ${selectedCustomer.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500">Account ID:</span>
                <div className="font-mono font-semibold text-slate-900">{selectedCustomer.customerId}</div>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <div className="font-semibold text-slate-900">{selectedCustomer.email}</div>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <div className="font-semibold text-slate-900">{selectedCustomer.phone || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-500">Lifetime Spent:</span>
                <div className="font-bold text-emerald-600">${selectedCustomer.totalSpent?.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Order History ({customerOrders.length})
              </h4>
              <div className="space-y-2">
                {customerOrders.map((ord) => (
                  <div key={ord._id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-600">{ord.orderId}</span>
                      <Badge variant={ord.orderStatus === 'delivered' ? 'success' : ord.orderStatus === 'cancelled' ? 'danger' : 'warning'}>
                        {ord.orderStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-slate-600 flex justify-between">
                      <span>Total: ${ord.orderAmount?.toFixed(2)} ({ord.paymentStatus})</span>
                      <span className="text-slate-400 text-[11px]">{new Date(ord.orderDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Items: {ord.products?.map((p) => `${p.quantity}x ${p.name}`).join(', ')}
                    </div>
                  </div>
                ))}
                {customerOrders.length === 0 && (
                  <div className="text-xs text-slate-400 py-4 text-center">No orders recorded for this customer.</div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Customer Modal */}
      <Modal isOpen={isNewCustModalOpen} onClose={() => setIsNewCustModalOpen(false)} title="Add Customer Record">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Robert Vance"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. robert@example.com"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Phone</label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. +1 555-0192"
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewCustModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
