# KubeCon 2017 Demos

In the process of building these demos based on Azure, Kubernetes, Istio, and Jenkins.

helm upgrade --install api-test ./charts/api-fault-test \
--set web.appName=web,\
web.image=briarprivate.azurecr.io/chzbrgr71/smackweb,\
web.imageTag=master-c399f02,\
web.versionLabel=faulttest,\
web.apiSvcName=api.default.svc.cluster.local,\
api.appName=api,\
api.image=briarprivate.azurecr.io/chzbrgr71/smackapi,\
api.imageTag=staging-a01cbc0,\
api.versionLabel=faulttest