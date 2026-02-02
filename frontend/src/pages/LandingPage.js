import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, MapPin, Leaf, ArrowRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_meals: 0,
    active_donors: 0,
    communities_served: 0,
    co2_saved: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'donor') navigate('/donor-dashboard');
      else if (user.role === 'recipient') navigate('/recipient-dashboard');
      else if (user.role === 'driver') navigate('/driver-dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="font-heading text-2xl text-foreground">Second Serve</span>
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <button
                onClick={handleGetStarted}
                data-testid="dashboard-btn"
                className="bg-primary text-primary-foreground hover:bg-primary-hover h-12 px-8 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  data-testid="login-btn"
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/login')}
                  data-testid="get-started-nav-btn"
                  className="bg-primary text-primary-foreground hover:bg-primary-hover h-12 px-8 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 hero-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground mb-4">Serving Meals. Serving Communities.</p>
              <h1 className="font-heading text-5xl md:text-7xl font-normal tracking-tight leading-[0.95] text-foreground mb-6">
                Rescue Food.<br />Feed Communities.
              </h1>
              <p className="text-lg md:text-xl font-light leading-relaxed text-foreground-muted mb-8 max-w-2xl">
                Connect surplus food from restaurants and stores with shelters and individuals who need it. Join our mission to reduce waste and fight hunger.
              </p>
              <button
                onClick={handleGetStarted}
                data-testid="hero-get-started-btn"
                className="bg-primary text-primary-foreground hover:bg-primary-hover h-14 px-10 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg inline-flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="md:col-span-5">
              <img
                src="https://images.unsplash.com/photo-1731156679850-e73fbc21564c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxjaGVmJTIwcGFja2luZyUyMGZvb2QlMjByZXN0YXVyYW50JTIwa2l0Y2hlbnxlbnwwfHx8fDE3NzAwMTA5MDN8MA&ixlib=rb-4.1.0&q=85"
                alt="Chef preparing food"
                className="rounded-2xl w-full h-auto shadow-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 px-6 md:px-12 bg-background-paper">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div data-testid="stat-meals" className="bg-background-subtle border-none rounded-3xl p-8 text-center">
              <Package className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-heading text-4xl md:text-5xl font-normal text-foreground mb-2">{stats.total_meals.toLocaleString()}</div>
              <p className="text-base text-foreground-muted">Meals Rescued</p>
            </div>
            <div data-testid="stat-donors" className="bg-background-subtle border-none rounded-3xl p-8 text-center">
              <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
              <div className="font-heading text-4xl md:text-5xl font-normal text-foreground mb-2">{stats.active_donors}</div>
              <p className="text-base text-foreground-muted">Active Donors</p>
            </div>
            <div data-testid="stat-communities" className="bg-background-subtle border-none rounded-3xl p-8 text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="font-heading text-4xl md:text-5xl font-normal text-foreground mb-2">{stats.communities_served}</div>
              <p className="text-base text-foreground-muted">Communities Served</p>
            </div>
            <div data-testid="stat-co2" className="bg-background-subtle border-none rounded-3xl p-8 text-center">
              <Leaf className="w-12 h-12 text-status-success mx-auto mb-4" />
              <div className="font-heading text-4xl md:text-5xl font-normal text-foreground mb-2">{stats.co2_saved.toLocaleString()}</div>
              <p className="text-base text-foreground-muted">kg CO₂ Saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tight leading-tight text-center mb-4">How It Works</h2>
          <p className="text-lg md:text-xl font-light leading-relaxed text-foreground-muted text-center mb-16 max-w-2xl mx-auto">
            Three simple steps to make a difference
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-border rounded-2xl p-8 shadow-card card-hover">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-normal leading-snug mb-4">Donate</h3>
              <p className="text-base font-normal leading-relaxed text-foreground-muted">
                Restaurants and stores list surplus food with details like quantity, expiry date, and location.
              </p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-8 shadow-card card-hover">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-normal leading-snug mb-4">Request</h3>
              <p className="text-base font-normal leading-relaxed text-foreground-muted">
                Shelters and individuals browse available food and request what they need based on dietary preferences.
              </p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-8 shadow-card card-hover">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-normal leading-snug mb-4">Deliver</h3>
              <p className="text-base font-normal leading-relaxed text-foreground-muted">
                Volunteer drivers pick up and deliver food to recipients, ensuring it reaches those who need it most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tight leading-tight text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed text-white/90 mb-8">
            Join thousands of donors, recipients, and volunteers making an impact in their communities.
          </p>
          <button
            onClick={handleGetStarted}
            data-testid="cta-get-started-btn"
            className="bg-white text-primary hover:bg-white/90 h-14 px-10 rounded-full font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Join Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-background-paper border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-heading text-xl text-foreground">Second Serve</span>
          </div>
          <p className="text-sm text-foreground-muted">
            © 2024 Second Serve. Serving Meals. Serving Communities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;