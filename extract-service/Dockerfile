# Stage 1: Build Stage
FROM python:3.10-slim-bookworm AS builder
WORKDIR /app

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Java 17
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir pyarrow pydantic-settings \
    && pip install --no-cache-dir -r requirements.txt
COPY . .

# Stage 2: Runtime Stage
FROM python:3.10-slim-bookworm AS runtime
WORKDIR /app

# Install Java 17 runtime + essential tools
RUN apt-get clean && rm -rf /var/lib/apt/lists/* && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        apt-transport-https \
        openjdk-17-jre-headless \
        procps \
        wget \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Java 17
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"
ENV PYARROW_IGNORE_TIMEZONE=1

# Download PostgreSQL JDBC Driver
RUN mkdir -p /app/jars && \
    wget -q -O /app/jars/postgresql-42.7.2.jar https://jdbc.postgresql.org/download/postgresql-42.7.2.jar

# Copy Python packages and app code from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

EXPOSE 5003

CMD ["python", "main.py"]



