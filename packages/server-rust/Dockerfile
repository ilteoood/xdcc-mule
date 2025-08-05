# Build stage
FROM rust:1.83-alpine as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Install build dependencies
RUN apk add --no-cache musl-dev openssl-dev

# Build the application
RUN cargo build --release

# Runtime stage
FROM alpine:3.20

# Install necessary runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    openssl

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/server-rust /app/server-rust

# Create a non-root user
RUN useradd -m -u 1001 appuser
USER appuser

# Expose the port
EXPOSE 3000

# Set default environment variables
ENV PORT=3000
ENV NICKNAME=xdcc-mule
ENV DOWNLOAD_PATH=/app/downloads

# Create downloads directory
RUN mkdir -p /app/downloads

CMD ["./server-rust"]
