FROM alpine
MAINTAINER Brian Redmond <brianisrunning@gmail.com>

ARG VCS_REF
ARG BUILD_DATE
ARG VERSION

# Metadata
LABEL org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.name="Microsmack API app" \
      org.label-schema.description="Simple golang web api for use in Kubernetes demos" \
      org.label-schema.vcs-url="https://github.com/chzbrgr71/microsmack" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.version=$VERSION \
      org.label-schema.docker.dockerfile="/smackapi/Dockerfile"

ENV GIT_SHA $VCS_REF
ENV APP_VERSION $VERSION
ENV IMAGE_BUILD_DATE $BUILD_DATE

WORKDIR /app
ADD ./smackapi /app/

ENTRYPOINT /app/smackapi
EXPOSE 8081