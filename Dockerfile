FROM alpine:latest as build

WORKDIR /opt/metl

COPY config /opt/metl/config
COPY controllers /opt/metl/controllers
COPY lib /opt/metl/lib
COPY models /opt/metl/models
COPY schemas /opt/metl/schemas
COPY src /opt/metl/src
COPY index.js /opt/metl/
COPY package.json /opt/metl/
COPY package-lock.json /opt/metl/
COPY server.js /opt/metl/
COPY angular.json /opt/metl/
COPY tsconfig.json /opt/metl/

ENV NODE_ENV development

RUN apk --no-cache add \
    nodejs \
    npm && \
    npm install -g @angular/cli@latest && \
    npm install && \
    ng build && \
    npm prune --production

# Build the release image
FROM alpine:latest as release

WORKDIR /opt/metl

RUN apk --no-cache add \
    nodejs \
    npm

COPY --from=build /opt/metl/ /opt/metl/

RUN echo `date` > /opt/metl/dist/metl/build.txt

EXPOSE 8000
ENV PORT 8000

CMD ["node", "server.js"]
