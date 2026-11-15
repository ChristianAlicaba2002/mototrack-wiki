# Dev sandbox for MotoTrack Wiki: runs Metro, lint, typecheck and expo-doctor
# in an isolated container. It does not build the native Android app — use a
# development build (`eas build --profile development`) on your device, which
# then connects to the Metro server running here.
#
# Node 22 matches CI (.github/workflows/ci.yml).
FROM node:22-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    EXPO_NO_TELEMETRY=1

# Corepack provides the exact pnpm version pinned in package.json "packageManager".
RUN corepack enable \
    && mkdir -p /app \
    && chown node:node /app

# Run as the unprivileged "node" user, not root.
USER node
WORKDIR /app

# Pre-create the cache dir so the compose volume mounted here is owned by "node".
RUN mkdir -p /app/.expo

# Install dependencies first so this layer is cached until the lockfile changes.
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

# Metro bundler / Expo dev server.
EXPOSE 8081

CMD ["pnpm", "start"]
