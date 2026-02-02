import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, LogOut, MapPin, Package, CheckCircle, Truck, Clock, Navigation } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DriverDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableOrders();
    fetchMyDeliveries();
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableOrders(response.data);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const fetchMyDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyDeliveries(response.data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/orders/${orderId}/assign`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAvailableOrders();
      fetchMyDeliveries();
      setActiveTab('deliveries');
    } catch (error) {
      console.error('Error accepting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/orders/${orderId}/status?new_status=${newStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyDeliveries();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-status-warning/10 text-status-warning border-status-warning/20';
      case 'in_transit':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'delivered':
        return 'bg-status-success/10 text-status-success border-status-success/20';
      default:
        return 'bg-muted text-foreground-muted border-border';
    }
  };

  const openInGoogleMaps = (pickup, delivery) => {
    const origin = `${pickup.address}, ${pickup.city}`;
    const destination = `${delivery.address}, ${delivery.city}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="font-heading text-2xl text-foreground">Second Serve</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-foreground-muted">Driver</p>
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
            Driver Dashboard
          </h1>
          <p className="text-base text-foreground-muted">Accept deliveries and help food reach those in need</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('available')}
            data-testid="available-tab"
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'available' ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Available Orders ({availableOrders.length})
            </div>
            {activeTab === 'available' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            data-testid="deliveries-tab"
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'deliveries' ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              My Deliveries ({myDeliveries.length})
            </div>
            {activeTab === 'deliveries' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Available Orders Tab */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableOrders.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Package className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-base text-foreground-muted">No available orders at the moment</p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <div key={order.id} data-testid={`available-order-${order.id}`} className="bg-white border border-border rounded-2xl p-6 shadow-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-heading text-xl font-normal text-foreground mb-1">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-foreground-muted">Recipient: {order.recipient_name}</p>
                    </div>
                    <div className="px-3 py-1 bg-status-warning/10 text-status-warning text-xs font-medium uppercase tracking-wide rounded-full">
                      Pending
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-foreground-muted mb-1">Pickup</p>
                        <p className="text-sm text-foreground font-medium">{order.pickup_location.address}</p>
                        <p className="text-sm text-foreground-muted">{order.pickup_location.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-foreground-muted mb-1">Delivery</p>
                        <p className="text-sm text-foreground font-medium">{order.delivery_location.address}</p>
                        <p className="text-sm text-foreground-muted">{order.delivery_location.city}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openInGoogleMaps(order.pickup_location, order.delivery_location)}
                      data-testid={`view-route-btn-${order.id}`}
                      className="flex-1 border-2 border-border text-foreground hover:bg-muted h-11 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      View Route
                    </button>
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      data-testid={`accept-btn-${order.id}`}
                      disabled={loading}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover h-11 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="space-y-4">
            {myDeliveries.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-base text-foreground-muted">No active deliveries</p>
              </div>
            ) : (
              myDeliveries.map((delivery) => (
                <div key={delivery.id} data-testid={`delivery-card-${delivery.id}`} className="bg-white border border-border rounded-2xl p-6 shadow-card">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="font-heading text-xl font-normal text-foreground mb-1">Order #{delivery.id.slice(0, 8)}</p>
                      <p className="text-sm text-foreground-muted">Recipient: {delivery.recipient_name}</p>
                    </div>
                    <div className={`px-3 py-1 text-xs font-medium uppercase tracking-wide rounded-full border ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-foreground-muted mb-1">Pickup</p>
                        <p className="text-sm text-foreground font-medium">{delivery.pickup_location.address}</p>
                        <p className="text-sm text-foreground-muted">{delivery.pickup_location.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-foreground-muted mb-1">Delivery</p>
                        <p className="text-sm text-foreground font-medium">{delivery.delivery_location.address}</p>
                        <p className="text-sm text-foreground-muted">{delivery.delivery_location.city}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openInGoogleMaps(delivery.pickup_location, delivery.delivery_location)}
                      data-testid={`navigate-btn-${delivery.id}`}
                      className="flex-1 min-w-[200px] border-2 border-primary text-primary hover:bg-primary/5 h-11 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </button>
                    {delivery.status === 'assigned' && (
                      <button
                        onClick={() => handleUpdateStatus(delivery.id, 'in_transit')}
                        data-testid={`start-delivery-btn-${delivery.id}`}
                        className="flex-1 min-w-[200px] bg-primary text-primary-foreground hover:bg-primary-hover h-11 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Start Delivery
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button
                        onClick={() => handleUpdateStatus(delivery.id, 'delivered')}
                        data-testid={`complete-delivery-btn-${delivery.id}`}
                        className="flex-1 min-w-[200px] bg-status-success text-white hover:bg-status-success/90 h-11 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Delivery
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;