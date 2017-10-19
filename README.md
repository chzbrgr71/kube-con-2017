# KubeCon 2017 Demos

In the process of building these demos based on Azure, Kubernetes, Istio, and Jenkins.

GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi

docker build --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` --build-arg VCS_REF=`git rev-parse --short HEAD` --build-arg VERSION=v3 -t chzbrgr71/smackapi:v3 .

docker run -d --name api -p 8081:8081 chzbrgr71/smackapi:v3