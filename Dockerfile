FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-slim
LABEL io.modelcontextprotocol.server.name="io.github.SamuelMoraesF/mcp-banco-inter"

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure storage directory exists
RUN mkdir -p /app/storage

ENV MCP_TRANSPORT=streamable-http
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=3000
ENV STORAGE_PATH=/app/storage

EXPOSE 3000

CMD ["node", "dist/index.js"]
