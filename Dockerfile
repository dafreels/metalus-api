FROM alpine:latest as build

WORKDIR /opt/metalus

# Download the Metalus Utils version
ADD https://github.com/Acxiom/metalus/releases/download/1.8.4/metalus-utils_2.12-spark_3.1-1.8.4.tar.gz /opt/metalus

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
# Build out the documentation
COPY docs /opt/metalus/docs
COPY Gruntfile.js /opt/metalus/
COPY tasks /opt/metalus/tasks
COPY templates.json /opt/metalus/

ENV NODE_ENV development
ARG PROD_MODE

RUN apk --no-cache add \
    nodejs \
    tar \
    npm && \
    tar -xf /opt/metalus/metalus-utils_2.12-spark_3.1-1.8.4.tar.gz && \
    rm -f /opt/metalus/metalus-utils_2.12-spark_3.1-1.8.4.tar.gz && \
    npm install -g @angular/cli@latest && \
    npm install -g grunt-cli && \
    npm install && \
    grunt docker-build && \
    ng build $PROD_MODE  && \
    npm prune --production

# Build the release image
FROM alpine:latest as release

WORKDIR /opt/metalus

RUN apk --no-cache add \
    nodejs \
    npm \
    openjdk8 \
    bash

COPY --from=build /opt/metalus/ /opt/metalus/

RUN echo `date` > /opt/metalus/dist/metalus/build.txt && \
    rm -f /opt/metalus/Gruntfile.js && \
    rm -rf /opt/metalus/tasks && \
    rm -rf /opt/metalus/docs

EXPOSE 8000
ENV PORT 8000
ENV JAR_COMMAND "/usr/lib/jvm/default-jvm/bin/jar"

CMD ["node", "server.js"]
