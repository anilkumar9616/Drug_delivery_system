FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production && npm install --save-dev nodemon

COPY src ./src
COPY .env.example .env

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "run", "dev"]
