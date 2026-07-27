FROM node:20-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/data /app/temp /app/tmp /app/logs

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
VOLUME ["/app/session", "/app/data", "/app/temp", "/app/tmp", "/app/logs"]

# The bot does not listen on HTTP; this is informational only.
# Port is not actually bound unless an HTTP server is started.
# EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=4 \
    CMD ["node", "-e", "const fs=require('fs'); const cmd=fs.readFileSync('/proc/1/cmdline','utf8'); process.exit(cmd.includes('node') && cmd.includes('index.js') ? 0 : 1)"]

CMD ["npm", "run", "start:production"]
