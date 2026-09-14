FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile

COPY . .

# Generate Prisma client with dummy DATABASE_URL for build time
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" yarn prisma generate

# Build TypeScript and verify output
RUN yarn build && ls -la dist/

EXPOSE 3000

CMD ["sh", "-c", "yarn prisma migrate deploy && yarn start"]
