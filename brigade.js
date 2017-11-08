const { events, Job, Group } = require('brigadier')

events.on("push", function(e, project) {
    console.log("==> received push for commit " + e.commit)
  
    // create a new job for go work
    var golang = new Job("job-runner-golang")
    golang.storage.enabled = false
    golang.image = "golang:1.7.5"
  
    // configure and run job with tasks
    golang.tasks = [
        "cd /src/",
        "go get github.com/gorilla/mux",
        "cd smackapi && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
        "go test -v"
    ]
    golang.run()
    console.log("==> golang build and test complete")

    // create a new job for docker work
    var docker = new Job("job-runner-docker")
    docker.storage.enabled = false
    docker.image = "docker:17.06.0"
    docker.privileged = true
    // need something like....
    // hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock')

    // setup variables
    var acrServer = "briarprivate.azurecr.io"
    var acrUsername = "briarprivate"
    var acrPassword = "x/ZaYBV2x3RRidBnPLgGH4gRXGJkBFHo"
    var apiImage = "chzbrgr71/smackapi"
    var imageTag = "btr123"
    var gitSHA = "212828"
    var apiACRImage = "${acrServer}/${apiImage}:${imageTag}"
    console.log("==> docker image for ACR is ${apiACRImage}")
  
    // configure and run job with tasks
    docker.tasks = [
        "cd /src/smackapi/",
        "docker login ${acrServer} -u ${acrUsername} -p ${acrPassword}",
        "docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${gitSHA} -t ${apiImage} .",
        "docker tag ${apiImage} ${apiACRImage}",
        "docker push ${apiACRImage}"
    ]
    docker.run()
    console.log("==> image pushed to ACR")

  })