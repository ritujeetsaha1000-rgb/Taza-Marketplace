from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ReturnDocument, ASCENDING
from app.core.config import settings

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=1500)
    return client


def set_client(custom_client: AsyncIOMotorClient) -> None:
    """Used for test injection / mock clients."""
    global client, db
    client = custom_client
    db = client[settings.DATABASE_NAME]


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency for providing the async MongoDB database instance."""
    global db
    if db is None:
        db = get_client()[settings.DATABASE_NAME]
    return db


async def get_next_sequence_value(database: AsyncIOMotorDatabase, sequence_name: str) -> int:
    """
    Atomically generates the next integer ID sequence value
    for 100% backward compatibility with numeric entity IDs.
    """
    counter = await database["counters"].find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return counter["seq"]


async def init_db() -> None:
    """Initialize MongoDB client, connect, and ensure essential indexes."""
    global client, db
    try:
        database = await get_db()
        # Test connection with a short timeout
        await client.admin.command('ping')
    except Exception as e:
        print(f"[DB] Real MongoDB not running on {settings.MONGO_URI} ({e}). Falling back to in-memory AsyncMongoMockClient.")
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[settings.DATABASE_NAME]
        database = db

    # Users Indexes
    await database["users"].create_index([("email", ASCENDING)], unique=True)
    await database["users"].create_index([("phone", ASCENDING)], unique=True)
    await database["users"].create_index([("id", ASCENDING)], unique=True)

    # District Metrics Indexes
    await database["district_metrics"].create_index([("district_name", ASCENDING)], unique=True)
    await database["district_metrics"].create_index([("id", ASCENDING)], unique=True)

    # Mandi Benchmarks Indexes
    await database["mandi_benchmarks"].create_index([("district_name", ASCENDING), ("crop_name", ASCENDING)])
    await database["mandi_benchmarks"].create_index([("id", ASCENDING)], unique=True)

    # Product Listings Indexes
    await database["product_listings"].create_index([("id", ASCENDING)], unique=True)
    await database["product_listings"].create_index([("farmer_id", ASCENDING)])
    await database["product_listings"].create_index([("crop_name", ASCENDING)])
    await database["product_listings"].create_index([("district", ASCENDING)])

    # Orders Indexes
    await database["orders"].create_index([("id", ASCENDING)], unique=True)
    await database["orders"].create_index([("order_number", ASCENDING)], unique=True)
    await database["orders"].create_index([("consumer_id", ASCENDING)])
    await database["orders"].create_index([("farmer_id", ASCENDING)])

    # Registered Farmers & Market Prices Indexes
    await database["registered_farmers"].create_index([("id", ASCENDING)], unique=True)
    await database["registered_farmers"].create_index([("contact_number", ASCENDING)])
    await database["registered_farmers"].create_index([("district_name", ASCENDING)])

    await database["market_prices"].create_index([("id", ASCENDING)], unique=True)
    await database["market_prices"].create_index([("district_name", ASCENDING), ("crop_name", ASCENDING)])

    # Route Logs
    await database["route_logs"].create_index([("id", ASCENDING)], unique=True)
    await database["route_logs"].create_index([("order_id", ASCENDING)])
