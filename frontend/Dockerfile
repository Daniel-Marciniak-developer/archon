FROM node:20-alpine as deps

RUN apk add --no-cache python3 make g++ git linux-headers eudev-dev

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --production=false

FROM node:20-alpine as runner

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

WORKDIR /app
RUN chown nextjs:nodejs /app

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package*.json ./
COPY --chown=nextjs:nodejs . .

USER nextjs

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
