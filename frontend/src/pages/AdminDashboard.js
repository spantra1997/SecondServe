import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Package, ShoppingCart, Truck, Users, LogOut, TrendingUp } from 'lucide-react';
import axios from 'axios';
import Logo from '../components/Logo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/login');
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [donationsRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/donations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDonations(donationsRes.data);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" color="#3A5A40" />
            <span className="font-heading text-2xl text-foreground">Second Serve</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {user?.name}
              </p>
              <p className="text-xs text-foreground-muted">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              data-testid="logout-btn"
              className="text-foreground hover:text-primary transition-colors p-2"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-normal tracking-tight leading-tight text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-base text-foreground-muted">Monitor and manage all platform activities</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div data-testid="admin-stat-donations" className="bg-white border border-border rounded-2xl p-6 shadow-card">
              <Package className="w-10 h-10 text-primary mb-3" />
              <div className="font-heading text-3xl font-normal text-foreground mb-1">{stats.donations.total}</div>
              <p className="text-sm text-foreground-muted">Total Donations</p>
              <div className="mt-3 text-xs text-foreground-muted">
                <span className="text-status-success">✓ {stats.donations.delivered} Delivered</span>
              </div>
            </div>
            <div data-testid="admin-stat-orders" className="bg-white border border-border rounded-2xl p-6 shadow-card">
              <ShoppingCart className="w-10 h-10 text-secondary mb-3" />
              <div className="font-heading text-3xl font-normal text-foreground mb-1">{stats.orders.total}</div>
              <p className="text-sm text-foreground-muted">Total Orders</p>
              <div className="mt-3 text-xs text-foreground-muted">
                <span className="text-status-warning">⏳ {stats.orders.pending} Pending</span>
              </div>
            </div>
            <div data-testid="admin-stat-deliveries" className="bg-white border border-border rounded-2xl p-6 shadow-card">
              <Truck className="w-10 h-10 text-primary mb-3" />
              <div className="font-heading text-3xl font-normal text-foreground mb-1">{stats.orders.in_transit}</div>
              <p className="text-sm text-foreground-muted">In Transit</p>
              <div className="mt-3 text-xs text-foreground-muted">
                <span className="text-primary">🚚 Active Deliveries</span>
              </div>
            </div>
            <div data-testid="admin-stat-users" className="bg-white border border-border rounded-2xl p-6 shadow-card">
              <Users className="w-10 h-10 text-status-success mb-3" />
              <div className="font-heading text-3xl font-normal text-foreground mb-1">{stats.users.total}</div>
              <p className="text-sm text-foreground-muted">Total Users</p>
              <div className="mt-3 text-xs text-foreground-muted">
                <span>{stats.users.donors}D · {stats.users.recipients}R · {stats.users.drivers}Dr</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('donations')}
            data-testid="donations-tab"
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'donations' ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              All Donations
            </div>
            {activeTab === 'donations' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            data-testid="orders-tab"
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'orders' ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              All Orders
            </div>
            {activeTab === 'orders' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="space-y-4">
            {donations.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-base text-foreground-muted">No donations yet</p>
              </div>
            ) : (
              donations.map((donation) => (
                <div key={donation.id} data-testid={`admin-donation-${donation.id}`} className="bg-white border border-border rounded-2xl p-6 shadow-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-normal text-foreground mb-1">{donation.food_type}</h3>
                      <p className="text-sm text-foreground-muted">By {donation.donor_name}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      donation.status === 'delivered' ? 'bg-status-success/10 text-status-success' :
                      donation.status === 'claimed' ? 'bg-status-warning/10 text-status-warning' :
                      'bg-status-info/10 text-status-info'
                    }`}>
                      {donation.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-foreground-muted mb-1">Quantity</p>
                      <p className="text-foreground font-medium">{donation.quantity}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted mb-1">Prepared At</p>
                      <p className="text-foreground font-medium">{donation.prepared_at || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted mb-1">Expires</p>
                      <p className="text-foreground font-medium">{donation.expiry_date}</p>
                    </div>
                    <div>
                      <p className="text-foreground-muted mb-1">Location</p>
                      <p className="text-foreground font-medium">{donation.location.city}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {/* Status Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {['all', 'pending', 'assigned', 'in_transit', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  data-testid={`filter-${status}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background-subtle text-foreground hover:bg-muted'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                  <p className="text-base text-foreground-muted">No orders found</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} data-testid={`admin-order-${order.id}`} className="bg-white border border-border rounded-2xl p-6 shadow-card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-heading text-lg font-normal text-foreground mb-1">Order #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-foreground-muted">Recipient: {order.recipient_name}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-status-success/10 text-status-success' :
                        order.status === 'in_transit' ? 'bg-primary/10 text-primary' :
                        order.status === 'assigned' ? 'bg-status-info/10 text-status-info' :
                        'bg-status-warning/10 text-status-warning'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-foreground-muted mb-1">Pickup</p>
                        <p className="text-foreground font-medium">{order.pickup_location.city}</p>
                      </div>
                      <div>
                        <p className="text-foreground-muted mb-1">Delivery</p>
                        <p className="text-foreground font-medium">{order.delivery_location.city}</p>
                      </div>
                      <div>
                        <p className="text-foreground-muted mb-1">Driver</p>
                        <p className="text-foreground font-medium">{order.driver_name || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;