import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Plus, Package, LogOut, MapPin, Calendar, CheckCircle, Clock, Truck } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DonorDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    food_type: '',
    quantity: '',
    prepared_at: '',
    expiry_date: '',
    description: '',
    photo_url: '',
    location: {
      address: '',
      city: '',
      lat: 0,
      lng: 0
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/donations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonations(response.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/donations`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateForm(false);
      setFormData({
        food_type: '',
        quantity: '',
        prepared_at: '',
        expiry_date: '',
        description: '',
        photo_url: '',
        location: { address: '', city: '', lat: 0, lng: 0 }
      });
      fetchDonations();
    } catch (error) {
      console.error('Error creating donation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <Package className="w-5 h-5 text-status-info" />;
      case 'claimed':
        return <Clock className="w-5 h-5 text-status-warning" />;
      case 'picked_up':
        return <Truck className="w-5 h-5 text-primary" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-status-success" />;
      default:
        return <Package className="w-5 h-5 text-foreground-muted" />;
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
              <p className="text-xs text-foreground-muted">Donor</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-normal tracking-tight leading-tight text-foreground mb-2">
              Donor Dashboard
            </h1>
            <p className="text-base text-foreground-muted">Manage your food donations and track their impact</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            data-testid="create-donation-btn"
            className="bg-primary text-primary-foreground hover:bg-primary-hover h-12 px-6 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Donation
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="font-heading text-2xl md:text-3xl font-normal leading-snug text-foreground mb-6">
                Create New Donation
              </h2>
              <form onSubmit={handleCreateDonation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Food Type</label>
                  <input
                    type="text"
                    data-testid="food-type-input"
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="e.g., Prepared meals, Bread, Vegetables"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
                  <input
                    type="text"
                    data-testid="quantity-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="e.g., 20 meals, 5kg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Prepared Date & Time</label>
                  <input
                    type="datetime-local"
                    data-testid="prepared-at-input"
                    value={formData.prepared_at}
                    onChange={(e) => setFormData({ ...formData, prepared_at: e.target.value })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    data-testid="expiry-date-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description (Optional)</label>
                  <textarea
                    data-testid="description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white border border-border rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    rows="3"
                    placeholder="Additional details about the food"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                  <input
                    type="text"
                    data-testid="address-input"
                    value={formData.location.address}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">City</label>
                  <input
                    type="text"
                    data-testid="city-input"
                    value={formData.location.city}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                    className="h-12 bg-white border border-border rounded-lg px-4 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="San Francisco"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    data-testid="cancel-btn"
                    className="flex-1 border-2 border-border text-foreground hover:bg-muted h-12 rounded-full font-medium transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-donation-btn"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover h-12 rounded-full font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Donation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Donations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Package className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
              <p className="text-base text-foreground-muted">No donations yet. Create your first donation!</p>
            </div>
          ) : (
            donations.map((donation) => (
              <div key={donation.id} data-testid={`donation-card-${donation.id}`} className="bg-white border border-border rounded-2xl p-6 shadow-card card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(donation.status)}
                    <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{donation.status}</span>
                  </div>
                </div>
                <h3 className="font-heading text-xl font-normal text-foreground mb-3">{donation.food_type}</h3>
                {/* Prominent Time Display */}
                <div className="bg-background-subtle rounded-lg p-3 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">Prepared:</span>
                    <span className="text-foreground font-medium">{new Date(donation.prepared_at).toLocaleString()}</span>
                  </div>
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
                  <p className="text-sm text-foreground-muted border-t border-border pt-4">{donation.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;