# Single-image build: serves the static site + API from one Node process.
# Works on Railway, Fly.io, Cloud Run, a VPS, etc.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/engine/package.json packages/engine/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm install
COPY . .
RUN npm run fonts -w @mozoleum/server && npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Copy only what the server needs to run + serve the built site.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/engine/dist ./packages/engine/dist
COPY --from=build /app/packages/engine/package.json ./packages/engine/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/fonts ./apps/server/fonts
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/web/dist ./apps/web/dist
EXPOSE 8787
CMD ["node", "apps/server/dist/index.js"]
