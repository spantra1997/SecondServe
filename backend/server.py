from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============= MODELS =============

class UserRole(BaseModel):
    role: str  # 'donor', 'recipient', 'driver'

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str  # 'donor', 'recipient', 'driver'
    phone: Optional[str] = None
    location: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Donation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    donor_id: str
    donor_name: str
    food_type: str
    quantity: str
    prepared_at: Optional[str] = None  # prepared date and time (optional for backward compatibility)
    expiry_date: str  # expiry date and time
    description: Optional[str] = None
    photo_url: Optional[str] = None
    location: dict
    status: str = "available"  # available, claimed, picked_up, delivered
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DonationCreate(BaseModel):
    food_type: str
    quantity: str
    prepared_at: str
    expiry_date: str
    description: Optional[str] = None
    photo_url: Optional[str] = None
    location: dict

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    donation_id: str
    recipient_id: str
    recipient_name: str
    donor_id: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    status: str = "pending"  # pending, assigned, in_transit, delivered, cancelled
    dietary_preferences: Optional[List[str]] = None
    pickup_location: dict
    delivery_location: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    estimated_delivery: Optional[str] = None

class OrderCreate(BaseModel):
    donation_id: str
    dietary_preferences: Optional[List[str]] = None
    delivery_location: dict

class ImpactStats(BaseModel):
    total_meals: int
    active_donors: int
    communities_served: int
    co2_saved: float

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user_doc is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        if isinstance(user_doc['created_at'], str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password', None)
    user = User(**user_doc)
    
    access_token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============= ADMIN ROUTES =============

@api_router.get("/admin/donations", response_model=List[Donation])
async def admin_get_all_donations(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    donations = await db.donations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for donation in donations:
        if isinstance(donation['created_at'], str):
            donation['created_at'] = datetime.fromisoformat(donation['created_at'])
    
    return donations

@api_router.get("/admin/orders", response_model=List[Order])
async def admin_get_all_orders(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.get("/admin/stats")
async def admin_get_detailed_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_donations = await db.donations.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    assigned_orders = await db.orders.count_documents({"status": "assigned"})
    in_transit_orders = await db.orders.count_documents({"status": "in_transit"})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    
    total_users = await db.users.count_documents({})
    donors = await db.users.count_documents({"role": "donor"})
    recipients = await db.users.count_documents({"role": "recipient"})
    drivers = await db.users.count_documents({"role": "driver"})
    
    return {
        "donations": {
            "total": total_donations,
            "available": await db.donations.count_documents({"status": "available"}),
            "claimed": await db.donations.count_documents({"status": "claimed"}),
            "delivered": await db.donations.count_documents({"status": "delivered"})
        },
        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "assigned": assigned_orders,
            "in_transit": in_transit_orders,
            "delivered": delivered_orders
        },
        "users": {
            "total": total_users,
            "donors": donors,
            "recipients": recipients,
            "drivers": drivers
        }
    }

# ============= DONATION ROUTES =============

@api_router.post("/donations", response_model=Donation)
async def create_donation(donation_data: DonationCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "donor":
        raise HTTPException(status_code=403, detail="Only donors can create donations")
    
    donation = Donation(
        donor_id=current_user.id,
        donor_name=current_user.name,
        **donation_data.model_dump()
    )
    
    donation_dict = donation.model_dump()
    donation_dict['created_at'] = donation_dict['created_at'].isoformat()
    
    await db.donations.insert_one(donation_dict)
    return donation

@api_router.get("/donations", response_model=List[Donation])
async def get_donations(status_filter: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if status_filter:
        query['status'] = status_filter
    
    if current_user.role == "donor":
        query['donor_id'] = current_user.id
    
    donations = await db.donations.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for donation in donations:
        if isinstance(donation['created_at'], str):
            donation['created_at'] = datetime.fromisoformat(donation['created_at'])
    
    return donations

@api_router.get("/donations/{donation_id}", response_model=Donation)
async def get_donation(donation_id: str, current_user: User = Depends(get_current_user)):
    donation = await db.donations.find_one({"id": donation_id}, {"_id": 0})
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    if isinstance(donation['created_at'], str):
        donation['created_at'] = datetime.fromisoformat(donation['created_at'])
    
    return Donation(**donation)

# ============= ORDER ROUTES =============

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "recipient":
        raise HTTPException(status_code=403, detail="Only recipients can create orders")
    
    # Get donation
    donation = await db.donations.find_one({"id": order_data.donation_id}, {"_id": 0})
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    if donation['status'] != "available":
        raise HTTPException(status_code=400, detail="Donation is not available")
    
    # Create order
    order = Order(
        donation_id=order_data.donation_id,
        recipient_id=current_user.id,
        recipient_name=current_user.name,
        donor_id=donation['donor_id'],
        dietary_preferences=order_data.dietary_preferences,
        pickup_location=donation['location'],
        delivery_location=order_data.delivery_location
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    
    # Update donation status
    await db.donations.update_one({"id": order_data.donation_id}, {"$set": {"status": "claimed"}})
    
    await db.orders.insert_one(order_dict)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == "recipient":
        query['recipient_id'] = current_user.id
    elif current_user.role == "donor":
        query['donor_id'] = current_user.id
    elif current_user.role == "driver":
        query['driver_id'] = current_user.id
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.get("/orders/available", response_model=List[Order])
async def get_available_orders(current_user: User = Depends(get_current_user)):
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can view available orders")
    
    orders = await db.orders.find({"status": "pending", "driver_id": None}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.patch("/orders/{order_id}/assign")
async def assign_driver(order_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can assign themselves")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] != "pending":
        raise HTTPException(status_code=400, detail="Order is not available")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"driver_id": current_user.id, "driver_name": current_user.name, "status": "assigned"}}
    )
    
    return {"message": "Order assigned successfully"}

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, new_status: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate status transition
    valid_statuses = ["pending", "assigned", "in_transit", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": new_status}})
    
    # Update donation status if order is delivered
    if new_status == "delivered":
        await db.donations.update_one({"id": order['donation_id']}, {"$set": {"status": "delivered"}})
    
    return {"message": "Order status updated successfully"}

# ============= IMPACT STATS =============

@api_router.get("/stats", response_model=ImpactStats)
async def get_impact_stats():
    total_donations = await db.donations.count_documents({"status": "delivered"})
    active_donors = await db.users.count_documents({"role": "donor"})
    
    # Get unique delivery locations for communities served
    orders = await db.orders.find({"status": "delivered"}, {"_id": 0, "delivery_location": 1}).to_list(1000)
    unique_communities = len(set(order['delivery_location'].get('city', 'Unknown') for order in orders if 'delivery_location' in order))
    
    # Estimate CO2 saved (rough estimate: 2.5 kg CO2 per meal saved from landfill)
    co2_saved = total_donations * 2.5
    
    return ImpactStats(
        total_meals=total_donations,
        active_donors=active_donors,
        communities_served=max(unique_communities, 1),
        co2_saved=round(co2_saved, 2)
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def initialize_admin():
    """Create admin user if it doesn't exist"""
    admin_email = "admin@secondserve.com"
    admin_password = "admin123"
    
    # Check if admin exists
    existing_admin = await db.users.find_one({"email": admin_email}, {"_id": 0})
    
    if not existing_admin:
        # Create admin user
        admin_user = User(
            email=admin_email,
            name="Admin User",
            role="admin"
        )
        
        admin_dict = admin_user.model_dump()
        admin_dict['created_at'] = admin_dict['created_at'].isoformat()
        admin_dict['password'] = hash_password(admin_password)
        
        await db.users.insert_one(admin_dict)
        logger.info(f"Admin user created: {admin_email}")
    else:
        logger.info(f"Admin user already exists: {admin_email}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()