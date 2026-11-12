import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Truck,
  RotateCcw,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested order cancellation');
  const [refundReason, setRefundReason] = useState('Product return authorized');
  const [refundAmount, setRefundAmount] = useState('');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // New Order Form states
  const [newCustName, setNewCustName] = useState('Sarah Jenkins');
  const [newCustEmail, setNewCustEmail] = useState('sarah.j@example.com');
  const [newCustId, setNewCustId] = useState('CUST-1001');
  const [newProdName, setNewProdName] = useState('Wireless Noise-Canceling Earbuds');
  const [newAmount, setNewAmount] = useState('79.99');

  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/orders?orderStatus=${statusFilter}&search=${search}`);
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const { data } = await api.post(`/orders/${selectedOrder._id}/cancel`, {
        reason: cancelReason,
      });
      if (data.success) {
        setIsCancelModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const handleRefundOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const { data } = await api.post(`/orders/${selectedOrder._id}/refund`, {
        amount: refundAmount ? Number(refundAmount) : selectedOrder.orderAmount,
        reason: refundReason,
      });
      if (data.success) {
        setIsRefundModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Refund failed');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/orders', {
        customerName: newCustName,
        customerEmail: newCustEmail,
        customerId: newCustId,
        orderAmount: Number(newAmount),
        products: [{ productId: 'PROD-' + Date.now(), name: newProdName, quantity: 1, price: Number(newAmount) }],
      });
      if (data.success) {
        setIsNewOrderModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Orders & Fulfillment</h2>
          <p className="text-xs text-slate-500">
            Internal order management database. The AI agent performs status checks, cancellations, and demo refunds here.
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Demo Order</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID (ORD-1001), tracking, customer..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl text-xs">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium capitalize text-[11px] transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Products</th>
                <th className="py-3 px-6">Total</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Payment</th>
                <th className="py-3 px-6">Tracking</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {orders.map((ord) => {
                const canCancel = ['pending', 'processing'].includes(ord.orderStatus);
                const canRefund = ['delivered', 'cancelled'].includes(ord.orderStatus) && ord.paymentStatus === 'paid';

                return (
                  <tr key={ord._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-indigo-600">
                      {ord.orderId}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-400">{ord.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-6 max-w-xs truncate">
                      {ord.products?.map((p) => `${p.quantity}x ${p.name}`).join(', ')}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      ${ord.orderAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge
                        variant={
                          ord.orderStatus === 'delivered'
                            ? 'success'
                            : ord.orderStatus === 'cancelled'
                            ? 'danger'
                            : ord.orderStatus === 'shipped'
                            ? 'purple'
                            : 'warning'
                        }
                      >
                        {ord.orderStatus.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 capitalize">
                      <span className={`inline-flex items-center gap-1 font-medium ${ord.paymentStatus === 'paid' ? 'text-emerald-600' : ord.paymentStatus === 'refunded' ? 'text-slate-400 line-through' : 'text-amber-600'}`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                      {ord.trackingNumber || 'Pending'}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-1 whitespace-nowrap">
                      {canCancel && (
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsCancelModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition border border-rose-200"
                        >
                          Cancel
                        </button>
                      )}
                      {canRefund && (
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setRefundAmount(ord.orderAmount.toString());
                            setIsRefundModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title={`Cancel Order: ${selectedOrder.orderId}`}
        >
          <form onSubmit={handleCancelOrder} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Cancelling order <strong>{selectedOrder.orderId}</strong> (${selectedOrder.orderAmount?.toFixed(2)}). An audit record will be logged.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Cancellation Reason</label>
              <input
                type="text"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Demo Refund Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          title={`Issue Demo Refund: ${selectedOrder.orderId}`}
        >
          <form onSubmit={handleRefundOrder} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Demonstration refund for order <strong>{selectedOrder.orderId}</strong>. No actual financial transaction is performed.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Refund Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                max={selectedOrder.orderAmount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Refund Reason</label>
              <input
                type="text"
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Process Demo Refund
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Demo Order Modal */}
      <Modal isOpen={isNewOrderModalOpen} onClose={() => setIsNewOrderModalOpen(false)} title="Create Demo Order">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Customer Name</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Customer Email</label>
            <input
              type="email"
              required
              value={newCustEmail}
              onChange={(e) => setNewCustEmail(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Product Name</label>
            <input
              type="text"
              required
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Order Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="mt-1 w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Orders;
