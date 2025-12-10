# Minimal Dockerfile for node-ui-example UI app.
#
# Intended usage:
# - Local dev: docker build && docker run
# - CI: used as a service container (hostname: app, port: 3000)

FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy application source
COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
