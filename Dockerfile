FROM node:20.11.1-alpine

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY src/ src/
RUN npm install
EXPOSE 3000
CMD [ "node", "src/server.js"]