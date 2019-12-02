FROM alpine:latest as build

WORKDIR /opt/metalus

COPY config /opt/metalus/config
COPY controllers /opt/metalus/controllers
COPY lib /opt/metalus/lib
COPY models /opt/metalus/models
COPY schemas /opt/metalus/schemas
COPY src /opt/metalus/src
COPY index.js /opt/metalus/
COPY package.json /opt/metalus/
COPY package-lock.json /opt/metalus/
COPY server.js /opt/metalus/
COPY angular.json /opt/metalus/
COPY tsconfig.json /opt/metalus/

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

WORKDIR /opt/metalus

RUN apk --no-cache add \
    nodejs \
    npm

COPY --from=build /opt/metalus/ /opt/metalus/

RUN echo `date` > /opt/metalus/dist/metalus/build.txt

EXPOSE 8000
ENV PORT 8000

CMD ["node", "server.js"]
