FROM alpine

ARG VCS_REF
ARG BUILD_DATE
ARG KUBECTL_VERSION=1.8.2
ARG ISTIO_VERSION=0.2.10

# Metadata
LABEL org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/lachie83/k8s-kubectl" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.docker.dockerfile="/Dockerfile"

ENV KUBE_LATEST_VERSION="v1.8.2"

RUN apk add --update ca-certificates \
 && apk add --update -t deps curl \
 && curl -L https://storage.googleapis.com/kubernetes-release/release/${KUBE_LATEST_VERSION}/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl \
 && chmod +x /usr/local/bin/kubectl \
 && apk del --purge deps \
 && rm /var/cache/apk/*

WORKDIR /

RUN apk add --update ca-certificates \
 && apk add --update -t deps curl \
 && curl -L https://github.com/istio/istio/releases/download/$ISTIO_VERSION/istio-$ISTIO_VERSION-linux.tar.gz | tar xz \
 && cd ./istio-$ISTIO_VERSION \
 && export PATH=$PWD/bin:$PATH \
 && cp bin/istioctl /usr/local/bin/ \
 && chmod +x /usr/local/bin/istioctl \
 && chown root:root /usr/local/bin/istioctl

ENTRYPOINT ["/bin/sh"]
CMD []