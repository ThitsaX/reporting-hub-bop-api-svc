# Dockerfile for MongoDB migrations
FROM mongo:7

# Copy migration scripts
COPY scripts/ /migrations/

# Set working directory
WORKDIR /migrations

# Default command runs the index creation script
CMD ["mongosh", "--host", "$MONGO_HOST", "--port", "$MONGO_PORT", "-u", "$MONGO_USER", "-p", "$MONGO_PASSWORD", "--authenticationDatabase", "$MONGO_AUTH_DB", "$MONGO_DATABASE", "--file", "create-transfer-indexes.js"]