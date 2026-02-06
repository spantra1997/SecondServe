import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Package, LogOut, MapPin, Calendar, Filter, ShoppingBag, Clock } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RecipientDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [orderTab, setOrderTab] = useState('active'); // 'active' or 'completed'
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState({
    address: '',
    city: '',
    lat: 0,
    lng: 0
  });
  const [loading, setLoading] = useState(false);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Nut-Free'];

  useEffect(() => {
    fetchAvailableDonations();
    fetchOrders();
  }, []);

  const fetchAvailableDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/donations?status_filter=available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonations(response.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleRequestFood = (donation) => {
    setSelectedDonation(donation);
    setShowRequestForm(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/orders`,
        {
          donation_id: selectedDonation.id,
          dietary_preferences: dietaryPreferences,
          delivery_location: deliveryLocation
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowRequestForm(false);
      setSelectedDonation(null);
      setDietaryPreferences([]);
      setDeliveryLocation({ address: '', city: '', lat: 0, lng: 0 });
      fetchAvailableDonations();
      fetchOrders();
      setActiveTab('orders');
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDietaryPreference = (pref) => {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-status-warning';
      case 'assigned':
        return 'text-status-info';
      case 'in_transit':
        return 'text-primary';
      case 'delivered':
        return 'text-status-success';
      default:
        return 'text-foreground-muted';
    }
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
              <p className="text-xs text-foreground-muted">Recipient</p>
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
            Recipient Dashboard
          </h1>
          <p className="text-base text-foreground-muted">Browse available food and track your requests</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('browse')}
            data-testid="browse-tab"
            className={`pb-4 px-2 font-medium transition-colors relative ${
              activeTab === 'browse' ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Browse Food
            </div>
            {activeTab === 'browse' && (
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
              <Clock className="w-5 h-5" />
              My Orders ({orders.length})
            </div>
            {activeTab === 'orders' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Request Form Modal */}
        {showRequestForm && selectedDonation && (
          <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="font-heading text-2xl md:text-3xl font-normal leading-snug text-foreground mb-6">
                Request Food
              </h2>
              <div className="mb-6 p-4 bg-background-subtle rounded-lg">
                <p className="font-medium text-foreground mb-1">{selectedDonation.food_type}</p>
                <p className="text-sm text-foreground-muted">Quantity: {selectedDonation.quantity}</p>
                <p className="text-sm text-foreground-muted">From: {selectedDonation.donor_name}</p>
              </div>
              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Dietary Preferences (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        data-testid={`dietary-${option.toLowerCase()}`}
                        onClick={() => toggleDietaryPreference(option)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          dietaryPreferences.includes(option)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background-subtle text-foreground hover:bg-muted'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Delivery Address</label>
                  <input
                    type="text"
                    data-testid="delivery-address-input"
                    value={deliveryLocation.address}
                    onChange={(e) => setDeliveryLocation({ ...deliveryLocation, address: e.target.value })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">City</label>
                  <input
                    type="text"
                    data-testid="delivery-city-input"
                    value={deliveryLocation.city}
                    onChange={(e) => setDeliveryLocation({ ...deliveryLocation, city: e.target.value })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="San Francisco"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestForm(false);
                      setSelectedDonation(null);
                    }}
                    data-testid="cancel-request-btn"
                    className="flex-1 border-2 border-border text-foreground hover:bg-muted h-12 rounded-full font-medium transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-request-btn"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover h-12 rounded-full font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Requesting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Package className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-base text-foreground-muted">No available donations at the moment</p>
              </div>
            ) : (
              donations.map((donation) => (
                <div key={donation.id} data-testid={`donation-card-${donation.id}`} className="bg-white border border-border rounded-2xl p-6 shadow-card card-hover">
                  <h3 className="font-heading text-xl font-normal text-foreground mb-2">{donation.food_type}</h3>
                  <p className="text-sm text-foreground-muted mb-3">By {donation.donor_name}</p>
                  {/* Prominent Time Display */}
                  <div className="bg-background-subtle rounded-lg p-3 mb-4 space-y-2">
                    {donation.prepared_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-muted">Prepared:</span>
                        <span className="text-foreground font-medium">{new Date(donation.prepared_at).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-muted">Expires:</span>
                      <span className="text-status-error font-medium">{new Date(donation.expiry_date).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-foreground-muted mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Quantity: {donation.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{donation.location.city}</span>
                    </div>
                  </div>
                  {donation.description && (
                    <p className="text-sm text-foreground-muted mb-4 pb-4 border-b border-border">{donation.description}</p>
                  )}
                  <button
                    onClick={() => handleRequestFood(donation)}
                    data-testid={`request-btn-${donation.id}`}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Request Food
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {/* Order Status Filter */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setOrderTab('active')}
                data-testid="active-orders-btn"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  orderTab === 'active'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background-subtle text-foreground hover:bg-muted'
                }`}
              >
                Active Orders
              </button>
              <button
                onClick={() => setOrderTab('completed')}
                data-testid="completed-orders-btn"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  orderTab === 'completed'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background-subtle text-foreground hover:bg-muted'
                }`}
              >
                Completed Orders
              </button>
            </div>

            <div className="space-y-4">
              {orders.filter(order => 
                orderTab === 'completed' ? order.status === 'delivered' : order.status !== 'delivered'
              ).length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                  <p className="text-base text-foreground-muted">
                    {orderTab === 'completed' ? 'No completed orders yet' : 'No active orders'}
                  </p>
                </div>
              ) : (
                orders.filter(order => 
                  orderTab === 'completed' ? order.status === 'delivered' : order.status !== 'delivered'
                ).map((order) => (
                  <div key={order.id} data-testid={`order-card-${order.id}`} className="bg-white border border-border rounded-2xl p-6 shadow-card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-heading text-xl font-normal text-foreground mb-1">Order #{order.id.slice(0, 8)}</p>
                        <p className={`text-sm font-medium uppercase tracking-wide ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-foreground-muted mb-1">Pickup Location</p>
                        <p className="text-foreground font-medium">{order.pickup_location.address}, {order.pickup_location.city}</p>
                      </div>
                      <div>
                        <p className="text-foreground-muted mb-1">Delivery Location</p>
                        <p className="text-foreground font-medium">{order.delivery_location.address}, {order.delivery_location.city}</p>
                      </div>
                      {order.driver_name && (
                        <div>
                          <p className="text-foreground-muted mb-1">Driver</p>
                          <p className="text-foreground font-medium">{order.driver_name}</p>
                        </div>
                      )}
                      {order.dietary_preferences && order.dietary_preferences.length > 0 && (
                        <div>
                          <p className="text-foreground-muted mb-1">Dietary Preferences</p>
                          <p className="text-foreground font-medium">{order.dietary_preferences.join(', ')}</p>
                        </div>
                      )}
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

export default RecipientDashboard;