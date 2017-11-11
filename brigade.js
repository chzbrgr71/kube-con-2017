const { events, Job, Group } = require('brigadier')

events.on("push", function(e, project) {
    console.log("==> received push for commit " + e.commit)

    // setup variables
    var acrServer = project.secrets.acrServer
    var acrUsername = project.secrets.acrUsername
    var acrPassword = project.secrets.acrPassword
    var apiImage = "chzbrgr71/smackapi"
    var gitSHA = "a01be2b"
    var imageTag = `PR-${gitSHA}`
    var apiACRImage = `${acrServer}/${apiImage}:${imageTag}`
    console.log(`==> docker image for ACR is ${apiACRImage}`)

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
        "cd /src/smackapi/"
        //"docker login ${acrServer} -u ${acrUsername} -p ${acrPassword}",
        //"docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${gitSHA} -t ${apiImage} .",
        //"docker tag ${apiImage} ${apiACRImage}",
        //"docker push ${apiACRImage}"
    ]
    
    // define job for k8s/helm work
    var helm = new Job("job-runner-helm")
    helm.storage.enabled = false
    helm.image = "lachlanevenson/k8s-helm:2.7.0"
    helm.tasks = [
        "helm init",
        "helm version"
    ]

    var pipeline = new Group()
    pipeline.add(golang)
    pipeline.add(docker)
    pipeline.add(helm)
    pipeline.runEach()

  })