FROM node:22-slim
WORKDIR /app

# 의존성 설치 (better-sqlite3 빌드를 위한 도구 포함)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

ENV DATA_DIR=/data
EXPOSE 4000
CMD ["npm", "start"]
