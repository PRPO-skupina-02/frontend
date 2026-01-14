FROM node:24 AS build

# Build arguments for API URLs
ARG VITE_AUTH_API_URL=https://auth.cinecore.timhrovat.com
ARG VITE_SPORED_API_URL=https://spored.cinecore.timhrovat.com
ARG VITE_NAKUP_API_URL=https://nakup.cinecore.timhrovat.com
ARG VITE_REKLAME_API_URL=https://reklame.cinecore.timhrovat.com

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Export build args as environment variables for Vite
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL \
    VITE_SPORED_API_URL=$VITE_SPORED_API_URL \
    VITE_NAKUP_API_URL=$VITE_NAKUP_API_URL \
    VITE_REKLAME_API_URL=$VITE_REKLAME_API_URL

RUN npm run build

FROM nginx:1.29

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
