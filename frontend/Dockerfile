FROM node:20-alpine
WORKDIR /frontend

COPY package*.json /frontend

# ARG NODE_ENV=development
RUN npm i

COPY . /frontend
EXPOSE 3000
CMD [ "npm","run","dev" ]
