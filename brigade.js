const { events, Job, Group } = require('brigadier')

events.on("push", function(e, project) {
    console.log("==> received push for commit " + e.commit)
  
    // setup variables
    var acrServer = "briarprivate.azurecr.io"
    var acrUsername = "briarprivate"
    var acrPassword = "x/ZaYBV2x3RRidBnPLgGH4gRXGJkBFHo"
    var apiImage = "chzbrgr71/smackapi"
    var imageTag = "btr123"
    var gitSHA = "212828"
    var apiACRImage = "${acrServer}/${apiImage}:${imageTag}"
    console.log("==> docker image for ACR is " + apiACRImage)

    // define job for golang work
    var golang = new Job("job-runner-golang")
    golang.storage.enabled = false
    golang.image = "golang:1.7.5"
    golang.tasks = [
        "cd /src/",
        "go get github.com/gorilla/mux",
        "cd smackapi && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
        "go test -v"
    ]
    
    // define job for docker work
    var docker = new Job("job-runner-docker")
    docker.storage.enabled = false
    docker.image = "docker:17.06.0"
    docker.privileged = true
    docker.tasks = [
        "cd /src/smackapi/",
        "cat Dockerfile"
        //"docker login ${acrServer} -u ${acrUsername} -p ${acrPassword}",
        //"docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${gitSHA} -t ${apiImage} .",
        //"docker tag ${apiImage} ${apiACRImage}",
        //"docker push ${apiACRImage}"
    ]

    // define job for k8s/helm work
    var kubectl = new Job("job-runner-helm")
    kubectl.storage.enabled = false
    kubectl.image = "lachlanevenson/k8s-helm:v2.5.0"
    kubectl.tasks = [
        "helm init"
    ]

    var pipeline = new Group()
    pipeline.add(golang)
    pipeline.add(docker)
    pipeline.runEach()

    console.log("==> complete")

  })