const { events, Job, Group } = require('brigadier')

events.on("push", function(e, project) {
    console.log("==> received push for commit " + e.commit)

    // setup variables
    var acrServer = project.secrets.acrServer
    var acrUsername = project.secrets.acrUsername
    var acrPassword = project.secrets.acrPassword
    var apiImage = "chzbrgr71/smackapi"
    var gitSHA = e.commit.substr(0,7)
    var eventType = e.type
    if (eventType === "push") {
        var imageTag = `prod-${gitSHA}`
    } else {
        var imageTag = `${eventType}-${gitSHA}`
    }
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
    //  docker.image = "docker:edge-dind"
    docker.image = "chzbrgr71/dnd"
    docker.privileged = true
    docker.tasks = [
        "dockerd-entrypoint.sh &",
        "echo waiting && sleep 20",
        "cd /src/smackapi/",
        `docker login ${acrServer} -u ${acrUsername} -p ${acrPassword}`,
        "GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
        `docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${gitSHA} -t ${apiImage} .`,
        `docker tag ${apiImage} ${apiACRImage}`,
        `docker push ${apiACRImage}`,
        "killall dockerd"
    ]
    
    // define job for k8s/helm work
    var helm = new Job("job-runner-helm")
    helm.storage.enabled = false
    helm.image = "lachlanevenson/k8s-helm:2.7.0"
    helm.tasks = [
        "helm init",
        "helm version"
    ]

    console.log("==> starting pipeline steps")
    var pipeline = new Group()
    pipeline.add(golang)
    pipeline.add(docker)
    pipeline.add(helm)
    pipeline.runEach()

  })