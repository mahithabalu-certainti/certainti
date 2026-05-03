# Stage 1: Build Stage
FROM python:3.9-slim-bookworm AS builder

# Install system dependencies for build
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    gcc \
    build-essential \
    python3-dev \
    libpq-dev \
    openjdk-17-jdk-headless && \
    rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME for PySpark
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Set workdir and install Python deps
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir pydantic-settings \
    && pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Stage 2: Runtime Stage
FROM python:3.9-slim-bookworm AS runtime

# Install only runtime dependencies (smaller image)
RUN apt-get clean && rm -rf /var/lib/apt/lists/* && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        openjdk-17-jre-headless \
        procps \
        wget \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME for PySpark
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Download PostgreSQL JDBC Driver
RUN mkdir -p /app/jars && \
    wget -q -O /app/jars/postgresql-42.7.2.jar https://jdbc.postgresql.org/download/postgresql-42.7.2.jar

WORKDIR /app

# Copy installed packages and app code from builder
COPY --from=builder /usr/local /usr/local
COPY --from=builder /app /app

# Expose port 5005
EXPOSE 5005

# Run app
CMD ["python", "main.py"]



