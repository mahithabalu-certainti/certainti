# Stage 1: Build Stage
FROM python:3.10-slim-bookworm AS builder
WORKDIR /app

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt
COPY . .

# Stage 2: Runtime Stage
FROM python:3.10-slim-bookworm AS runtime
WORKDIR /app

# Install essential tools if needed (optional based on requirements)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy from the build stage
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

EXPOSE 5012

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5012", "--workers", "3"]
 


