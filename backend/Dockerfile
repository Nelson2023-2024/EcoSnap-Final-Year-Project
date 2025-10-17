FROM node:20-alpine
WORKDIR /app
COPY package.json /app

ARG NODE_ENV=development
RUN if [ "${NODE_ENV}" = "development" ]; \
    then npm i; \
    else npm i --only=production; \
    fi

COPY . /app
EXPOSE 8080
CMD [ "npm","run","dev" ]