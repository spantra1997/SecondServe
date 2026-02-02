#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class SecondServeAPITester:
    def __init__(self, base_url="https://food-rescue-62.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.donations = {}  # Store created donations
        self.orders = {}     # Store created orders
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params)
            
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_health_check(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code in [200, 404]  # 404 is ok for root endpoint
            self.log_test("API Health Check", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_impact_stats(self):
        """Test impact statistics endpoint (public)"""
        response = self.make_request('GET', 'stats')
        if not response:
            self.log_test("Impact Stats", False, "No response")
            return False
        
        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                required_fields = ['total_meals', 'active_donors', 'communities_served', 'co2_saved']
                has_all_fields = all(field in data for field in required_fields)
                success = has_all_fields
                details = f"Fields: {list(data.keys())}" if not has_all_fields else ""
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"
        
        self.log_test("Impact Stats", success, details)
        return success

    def test_user_registration(self, role):
        """Test user registration for different roles"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "email": f"test_{role}_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test {role.title()} {timestamp}",
            "role": role,
            "phone": "+1234567890"
        }

        response = self.make_request('POST', 'auth/register', user_data)
        if not response:
            self.log_test(f"Register {role.title()}", False, "No response")
            return False

        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    self.tokens[role] = data['access_token']
                    self.users[role] = data['user']
                else:
                    success = False
                    details = "Missing token or user data"
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"
            if response.text:
                details += f", Response: {response.text[:100]}"

        self.log_test(f"Register {role.title()}", success, details if not success else "")
        return success

    def test_user_login(self, role):
        """Test user login"""
        if role not in self.users:
            self.log_test(f"Login {role.title()}", False, "User not registered")
            return False

        user = self.users[role]
        login_data = {
            "email": user['email'],
            "password": "TestPass123!"
        }

        response = self.make_request('POST', 'auth/login', login_data)
        if not response:
            self.log_test(f"Login {role.title()}", False, "No response")
            return False

        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                if 'access_token' in data:
                    self.tokens[f"{role}_login"] = data['access_token']
                else:
                    success = False
                    details = "Missing access token"
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"

        self.log_test(f"Login {role.title()}", success, details if not success else "")
        return success

    def test_get_current_user(self, role):
        """Test getting current user info"""
        if role not in self.tokens:
            self.log_test(f"Get Current User {role.title()}", False, "No token available")
            return False

        response = self.make_request('GET', 'auth/me', token=self.tokens[role])
        if not response:
            self.log_test(f"Get Current User {role.title()}", False, "No response")
            return False

        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                success = data['role'] == role and 'id' in data
                details = f"Role mismatch: {data.get('role')} != {role}" if not success else ""
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"

        self.log_test(f"Get Current User {role.title()}", success, details if not success else "")
        return success

    def test_create_donation(self):
        """Test creating a donation (donor only)"""
        if 'donor' not in self.tokens:
            self.log_test("Create Donation", False, "No donor token")
            return False

        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        donation_data = {
            "food_type": "Prepared meals",
            "quantity": "20 meals",
            "expiry_date": tomorrow,
            "description": "Fresh prepared meals from restaurant",
            "location": {
                "address": "123 Main St",
                "city": "San Francisco",
                "lat": 37.7749,
                "lng": -122.4194
            }
        }

        response = self.make_request('POST', 'donations', donation_data, self.tokens['donor'])
        if not response:
            self.log_test("Create Donation", False, "No response")
            return False

        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                if 'id' in data:
                    self.donations['test_donation'] = data
                else:
                    success = False
                    details = "Missing donation ID"
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"
            if response.text:
                details += f", Response: {response.text[:100]}"

        self.log_test("Create Donation", success, details if not success else "")
        return success

    def test_get_donations(self, role):
        """Test getting donations list"""
        if role not in self.tokens:
            self.log_test(f"Get Donations {role.title()}", False, "No token")
            return False

        response = self.make_request('GET', 'donations', token=self.tokens[role])
        if not response:
            self.log_test(f"Get Donations {role.title()}", False, "No response")
            return False

        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                success = isinstance(data, list)
                details = f"Expected list, got {type(data)}" if not success else ""
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"

        self.log_test(f"Get Donations {role.title()}", success, details if not success else "")
        return success

    def test_create_order(self):
        """Test creating an order (recipient only)"""
        if 'recipient' not in self.tokens:
            self.log_test("Create Order", False, "No recipient token")
            return False

        if 'test_donation' not in self.donations:
            self.log_test("Create Order", False, "No donation available")
            return False

        order_data = {
            "donation_id": self.donations['test_donation']['id'],
            "dietary_preferences": ["Vegetarian", "Gluten-Free"],
            "delivery_location": {
                "address": "456 Oak St",
                "city": "San Francisco",
                "lat": 37.7849,
                "lng": -122.4094
            }
        }

        response = self.make_request('POST', 'orders', order_data, self.tokens['recipient'])
        if not response:
            self.log_test("Create Order", False, "No response")
            return False

        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                if 'id' in data:
                    self.orders['test_order'] = data
                else:
                    success = False
                    details = "Missing order ID"
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"
            if response.text:
                details += f", Response: {response.text[:100]}"

        self.log_test("Create Order", success, details if not success else "")
        return success

    def test_get_available_orders(self):
        """Test getting available orders (driver only)"""
        if 'driver' not in self.tokens:
            self.log_test("Get Available Orders", False, "No driver token")
            return False

        response = self.make_request('GET', 'orders/available', token=self.tokens['driver'])
        if not response:
            self.log_test("Get Available Orders", False, "No response")
            return False

        success = response.status_code == 200
        if success:
            try:
                data = response.json()
                success = isinstance(data, list)
                details = f"Expected list, got {type(data)}" if not success else ""
            except:
                success = False
                details = "Invalid JSON response"
        else:
            details = f"Status: {response.status_code}"

        self.log_test("Get Available Orders", success, details if not success else "")
        return success

    def test_assign_driver(self):
        """Test driver accepting an order"""
        if 'driver' not in self.tokens:
            self.log_test("Assign Driver", False, "No driver token")
            return False

        if 'test_order' not in self.orders:
            self.log_test("Assign Driver", False, "No order available")
            return False

        order_id = self.orders['test_order']['id']
        response = self.make_request('PATCH', f'orders/{order_id}/assign', token=self.tokens['driver'])
        if not response:
            self.log_test("Assign Driver", False, "No response")
            return False

        success = response.status_code == 200
        details = f"Status: {response.status_code}" if not success else ""

        self.log_test("Assign Driver", success, details if not success else "")
        return success

    def test_update_order_status(self):
        """Test updating order status"""
        if 'driver' not in self.tokens:
            self.log_test("Update Order Status", False, "No driver token")
            return False

        if 'test_order' not in self.orders:
            self.log_test("Update Order Status", False, "No order available")
            return False

        order_id = self.orders['test_order']['id']
        response = self.make_request('PATCH', f'orders/{order_id}/status', 
                                   token=self.tokens['driver'], 
                                   params={'new_status': 'in_transit'})
        if not response:
            self.log_test("Update Order Status", False, "No response")
            return False

        success = response.status_code == 200
        details = f"Status: {response.status_code}" if not success else ""

        self.log_test("Update Order Status", success, details if not success else "")
        return success

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Second Serve API Tests...")
        print("=" * 50)

        # Basic connectivity
        if not self.test_health_check():
            print("❌ API is not accessible. Stopping tests.")
            return False

        # Public endpoints
        self.test_impact_stats()

        # User registration for all roles
        roles = ['donor', 'recipient', 'driver']
        for role in roles:
            self.test_user_registration(role)

        # User login tests
        for role in roles:
            self.test_user_login(role)

        # Authentication tests
        for role in roles:
            self.test_get_current_user(role)

        # Donation workflow
        self.test_create_donation()
        for role in roles:
            self.test_get_donations(role)

        # Order workflow
        self.test_create_order()
        self.test_get_available_orders()
        self.test_assign_driver()
        self.test_update_order_status()

        # Final stats check (should show updated numbers)
        self.test_impact_stats()

        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        return len(self.failed_tests) == 0

def main():
    tester = SecondServeAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())