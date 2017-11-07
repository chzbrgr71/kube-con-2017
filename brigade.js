const { events, Job, Group } = require('brigadier')

events.on("push", function(e, project) {
    console.log("received push for commit " + e.commit)
  
    // Create a new job
    var node = new Job("job-runner-golang")
    node.storage.enabled = false
  
    // use golang image for first step
    node.image = "golang:1.7.5"
  
    // Now we want it to run these commands in order:
    node.tasks = [
      "cd /src/",
      "go get github.com/gorilla/mux",
      "cd smackapi && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi",
      "go test -v"
    ]
  
    // We're done configuring, so we run the job
    node.run()
  })