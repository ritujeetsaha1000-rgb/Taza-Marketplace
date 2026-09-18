import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient
from app.core.database import set_client, init_db
from db import seed_database


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    mock_client = AsyncMongoMockClient()
    set_client(mock_client)
    await init_db()
    await seed_database()
