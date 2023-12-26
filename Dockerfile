FROM node:12.0
WORKDIR /usr/src/app
COPY package*.json ./
COPY angular.json ./
COPY tsconfig.json ./
RUN npm ci --omit=dev
COPY ./src ./src
COPY ./server/ ./server
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
