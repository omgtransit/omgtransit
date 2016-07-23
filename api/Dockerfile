FROM node:argon

# Setup Folders
ENV API_HOME /usr/src/api
RUN mkdir -p $API_HOME

WORKDIR $API_HOME
COPY package.json $API_HOME
RUN npm install

# Bundle app source
COPY . $API_HOME

