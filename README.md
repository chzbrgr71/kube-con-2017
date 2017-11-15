# KubeCon 2017 Demos

In the process of building these demos based on Azure, Kubernetes, Istio, and Brigade.

helm upgrade --install smackapi-new ./charts/smackapi --namespace microsmack --set api.image=briarprivate.azurecr.io/chzbrgr71/smackapi --set api.imageTag=prod-aea163d --set api.deployment=smackapi-new --set api.versionLabel=new

helm upgrade --install microsmack-routes ./charts/routes --namespace microsmack --set prodLabel=prod --set prodWeight=10 --set canaryLabel=new --set canaryWeight=90