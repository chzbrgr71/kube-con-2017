const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    
    // setup variables
    var acrServer = project.secrets.acrServer
    var acrUsername = project.secrets.acrUsername
    var acrPassword = project.secrets.acrPassword
    var apiImage = "chzbrgr71/smackapi"
    var gitSHA = brigadeEvent.commit.substr(0,7)
    var eventType = brigadeEvent.type
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var branch = getBranch(gitPayload)
    var imageTag = `${branch}-${gitSHA}`
    var apiACRImage = `${acrServer}/${apiImage}`
    
    console.log(`==> GitHub webook (${branch}) with commit ID ${gitSHA}`)
    console.log(`==> Docker image for ACR is ${apiACRImage}:${imageTag}`)

    // setup brigade jobs
    var golang = new Job("job-runner-golang")
    goJobRunner(golang)

    // define job for docker work
    var docker2 = new Job("job-runner-docker")
    docker2.storage.enabled = false
    docker2.image = "chzbrgr71/dnd:v5"
    docker2.privileged = true
    docker2.tasks = [
        "dockerd-entrypoint.sh &",
        "echo waiting && sleep 20",
        "cd /src/smackapi/",
        `docker login ${acrServer} -u ${acrUsername} -p ${acrPassword}`,
        "go get github.com/gorilla/mux",
        "GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
        `docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${gitSHA} -t ${apiImage} .`,
        `docker tag ${apiImage} ${apiACRImage}:${imageTag}`,
        `docker push ${apiACRImage}:${imageTag}`,
        "killall dockerd"
    ]

    // define job for k8s/helm work
    var helm2 = new Job("job-runner-helm")
    helm2.storage.enabled = false
    helm2.image = "lachlanevenson/k8s-helm:2.7.0"
    helm2.tasks = [
        "cd /src/",
        "helm version",
        `helm upgrade --install smackapi-prod ./charts/smackapi --namespace microsmack --set api.image=${apiACRImage} --set api.imageTag=${imageTag} --set api.deployment=smackapi-prod --set api.versionLabel=prod`,
        `helm upgrade --install microsmack-routes ./charts/routes --namespace microsmack --set prodLabel=prod --set prodWeight=100 --set canaryLabel=new --set canaryWeight=0`
    ]

    console.log("==> starting pipeline steps")
    var pipeline2 = new Group()
    pipeline2.add(golang)
    //pipeline2.add(docker2)
    //pipeline2.add(helm2)
    if (gitPayload.ref == "refs/heads/master") {
        pipeline2.runEach()
    }
    
})

events.on("pull_request", (e, project) => {
    console.log("==> received pull request for commit " + e.commit)

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
    var apiACRImage = `${acrServer}/${apiImage}`
    console.log(`==> docker image for ACR is ${apiACRImage}:${imageTag}`)

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
    docker.image = "chzbrgr71/dnd:v5"
    docker.privileged = true
    docker.tasks = [
        "dockerd-entrypoint.sh &",
        "echo waiting && sleep 20",
        "cd /src/smackapi/",
        `docker login ${acrServer} -u ${acrUsername} -p ${acrPassword}`,
        "go get github.com/gorilla/mux",
        "GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
        `docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${gitSHA} -t ${apiImage} .`,
        `docker tag ${apiImage} ${apiACRImage}:${imageTag}`,
        `docker push ${apiACRImage}:${imageTag}`,
        "killall dockerd"
    ]
    
    // define job for k8s/helm work
    var helm = new Job("job-runner-helm")
    helm.storage.enabled = false
    helm.image = "lachlanevenson/k8s-helm:2.7.0"
    helm.tasks = [
        "cd /src/",
        "helm version",
        `helm upgrade --install smackapi-new ./charts/smackapi --namespace microsmack --set api.image=${apiACRImage} --set api.imageTag=${imageTag} --set api.deployment=smackapi-new --set api.versionLabel=new`,
        `helm upgrade --install microsmack-routes ./charts/routes --namespace microsmack --set prodLabel=prod --set prodWeight=10 --set canaryLabel=new --set canaryWeight=90`
    ]

    console.log("==> starting pipeline steps")
    var pipeline = new Group()
    pipeline.add(golang)
    pipeline.add(docker)
    pipeline.add(helm)
    pipeline.runEach()

})

function getBranch (p) {
    //refs/heads/master
    var ref = gitPayload.ref
    if (ref) {
        return ref.substring(11)
    } else {
        return "PR"
    }
}

function goJobRunner(g) {
    // define job for golang work
    g.storage.enabled = false
    g.image = "golang:1.7.5"
    g.tasks = [
        "cd /src/",
        "go get github.com/gorilla/mux",
        "cd smackapi && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
        "go test -v"
    ]
}