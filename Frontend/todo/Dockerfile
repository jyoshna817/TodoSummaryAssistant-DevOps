FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG REACT_APP_API_BASE_URL=
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
RUN addgroup -S app && adduser -S app -G app &&     chown -R app:app /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html &&     touch /var/run/nginx.pid && chown app:app /var/run/nginx.pid
USER app
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O - http://127.0.0.1:8081/healthz | grep -q ok
