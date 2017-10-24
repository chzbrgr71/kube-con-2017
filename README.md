# KubeCon 2017 Demos

In the process of building these demos based on Azure, Kubernetes, Istio, and Jenkins.

sh "helm upgrade --install smackapi-pr ./charts/smackapi --namespace default --set image=briarprivate.azurecr.io/chzbrgr71/smackapi,imageTag=${imageTag},versionLabel=${imageTag},istio.routeName=smackapi-pr,istio.precedence=100,istio.smackapiMasterTag=prod,istio.smackapiMasterWeight=50,istio.smackapiPRTag=${imageTag},istio.smackapiPRWeight=50"

sh "helm upgrade --install smackapi ./charts/smackapi --namespace default --set image=briarprivate.azurecr.io/chzbrgr71/smackapi,imageTag=${imageTag},versionLabel=prod,istio.routeName=smackapi-prod,istio.precedence=50,istio.smackapiMasterTag=prod,istio.smackapiMasterWeight=100,istio.smackapiPRTag=anything,istio.smackapiPRWeight=0"