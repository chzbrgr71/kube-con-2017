const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    
    // setup variables in map
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var brigConfig = new Map()
    brigConfig.set("acrServer", project.secrets.acrServer)
    brigConfig.set("acrUsername", project.secrets.acrUsername)
    brigConfig.set("acrPassword", project.secrets.acrPassword)
    brigConfig.set("apiImage", "chzbrgr71/smackapi")
    brigConfig.set("gitSHA", brigadeEvent.commit.substr(0,7))
    brigConfig.set("eventType", brigadeEvent.type)
    brigConfig.set("branch", getBranch(gitPayload))
    brigConfig.set("imageTag", `${brigConfig.get("branch")}-${brigConfig.get("gitSHA")}`)
    brigConfig.set("apiACRImage", `${brigConfig.get("acrServer")}/${brigConfig.get("apiImage")}`)
    
    console.log(`==> gitHub webook (${brigConfig.get("branch")}) with commit ID ${brigConfig.get("gitSHA")}`)
    
    // setup brigade jobs
    var golang = new Job("job-runner-golang")
    var docker = new Job("job-runner-docker")
    var helm = new Job("job-runner-helm")
    goJobRunner(golang)
    dockerJobRunner(brigConfig, docker)
    helmJobRunner(brigConfig, helm, 50, 50)

    // start pipeline
    console.log(`==> starting pipeline for docker image: ${brigConfig.get("apiACRImage")}:${brigConfig.get("imageTag")}`)
    var pipeline = new Group()
    pipeline.add(golang)
    pipeline.add(docker)
    pipeline.add(helm)
    if (brigConfig.get("branch") == "master") {
        pipeline.runEach()
    } else {
        console.log(`==> no jobs to run when not master`)
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
    if (p.ref) {
        return p.ref.substring(11)
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

function dockerJobRunner(config, d) {
    d.storage.enabled = false
    d.image = "chzbrgr71/dnd:v5"
    d.privileged = true
    d.tasks = [
        "dockerd-entrypoint.sh &",
        "echo waiting && sleep 20",
        "cd /src/smackapi/",
        `docker login ${config.get("acrServer")} -u ${config.get("acrUsername")} -p ${config.get("acrPassword")}`,
        "go get github.com/gorilla/mux",
        "GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
        `docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${config.get("imageTag")} --build-arg VCS_REF=${config.get("gitSHA")} -t ${config.get("apiImage")} .`,
        `docker tag ${config.get("apiImage")} ${config.get("apiACRImage")}:${config.get("imageTag")}`,
        `docker push ${config.get("apiACRImage")}:${config.get("imageTag")}`,
        "killall dockerd"
    ]
}

function helmJobRunner (config, h, prodWeight, canaryWeight) {
    h.storage.enabled = false
    h.image = "lachlanevenson/k8s-helm:2.7.0"
    h.tasks = [
        "cd /src/",
        `helm upgrade --install smackapi-prod ./charts/smackapi --namespace microsmack --set api.image=${config.get("apiACRImage")} --set api.imageTag=${config.get("imageTag")} --set api.deployment=smackapi-prod --set api.versionLabel=prod`,
        `helm upgrade --install microsmack-routes ./charts/routes --namespace microsmack --set prodLabel=prod --set prodWeight=${prodWeight} --set canaryLabel=new --set canaryWeight=${canaryWeight}`
    ]
}