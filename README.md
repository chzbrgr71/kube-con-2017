# KubeCon 2017 Demos

In the process of building these demos based on Azure, Kubernetes, Istio, and Jenkins.

kubectl create rolebinding jenkins-sa-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=jenkins:default \
  --namespace=jenkins

kubectl create rolebinding jenkins-sa-admin2 \
  --clusterrole=cluster-admin \
  --serviceaccount=jenkins:jenkins-jenkins \
  --namespace=jenkins