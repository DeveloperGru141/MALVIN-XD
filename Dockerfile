FROM node:20-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/data /app/temp /app/tmp

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "try { require('fs').accessSync('./session/creds.json'); process.exit(0); } catch(e) { process.exit(1); }"

CMD ["npm", "start"]
