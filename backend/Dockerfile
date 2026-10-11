FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# this placeholder is only for generating Prisma Client during the build. The Compose environment section supplies the real URL when the backend container starts.
ENV DATABASE_URL="postgresql://postgres:build-placeholder@localhost:5432/research_portal"
RUN npx prisma generate
ENV DATABASE_URL=""

EXPOSE 8003
CMD ["./start.sh"]
