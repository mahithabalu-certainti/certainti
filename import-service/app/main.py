from fastapi import FastAPI
from app.api.routers import router
from app.core.config import settings
from app.core.constants import Constants
import logging

app = FastAPI(
    title=Constants.API.SERVICE_TITLE,
    version=Constants.API.SERVICE_VERSION
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(), logging.FileHandler('app.log')]
)

# Include API routes
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)