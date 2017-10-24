#!/usr/bin/groovy
import java.text.SimpleDateFormat

podTemplate(label: 'jenkins-pipeline', containers: [
    containerTemplate(name: 'jnlp', image: 'jenkinsci/jnlp-slave:2.62', args: '${computer.jnlpmac} ${computer.name}', workingDir: '/home/jenkins', resourceRequestCpu: '200m', resourceLimitCpu: '200m', resourceRequestMemory: '256Mi', resourceLimitMemory: '256Mi'),
    containerTemplate(name: 'golang', image: 'golang:1.7.5', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'docker', image: 'docker:17.06.0', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'helm', image: 'lachlanevenson/k8s-helm:v2.6.1', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'kubectl', image: 'lachlanevenson/k8s-kubectl:v1.7.8', command: 'cat', ttyEnabled: true)
],
volumes:[
    hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock')
])
    {
        node ('jenkins-pipeline') {
            println "DEBUG: Pipeline starting"
        
            // grab repo from source control
            checkout scm

            // configuration parameters and variables for pipeline
            def pwd = pwd()
            def repo = "chzbrgr71"
            def acrServer = "briarprivate.azurecr.io"
            def acrJenkinsCreds = "acr_creds" //this is set in Jenkins global credentials
            sh 'git rev-parse HEAD > git_commit_id.txt'
            try {
                env.GIT_COMMIT_ID = readFile('git_commit_id.txt').trim()
                env.GIT_SHA = env.GIT_COMMIT_ID.substring(0, 7)
            } catch (e) {
                error "${e}"
            }
            def buildName = env.JOB_NAME
            def buildNumber = env.BUILD_NUMBER
            def imageTag = env.BRANCH_NAME + '-' + env.GIT_SHA
            def date = new Date()
            sdf = new SimpleDateFormat("MM/dd/yyyy HH:mm:ss")
            def buildDate = sdf.format(date)
            def apiImage = "${repo}/smackapi:${imageTag}"

            // write out variables for debug purposes
            println "DEBUG: env.GIT_COMMIT_ID ==> ${env.GIT_COMMIT_ID}"
            println "DEBUG: env.GIT_SHA ==> ${env.GIT_SHA}"
            println "DEBUG: env.BRANCH_NAME ==> ${env.BRANCH_NAME}"
            println "DEBUG: env.JOB_NAME ==> ${env.JOB_NAME}"
            println "DEBUG: env.BUILD_NUMBER ==> ${env.BUILD_NUMBER}"
            println "DEBUG: buildDate ==> " + buildDate
            println "DEBUG: imageTag ==> " + imageTag
            println "DEBUG: apiImage ==> " + apiImage

            stage ('code compile and test') {
                container('golang') {
                    sh "go get github.com/gorilla/mux"
                    sh "cd smackapi && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o smackapi"
                    sh "cd smackapi && go test -v"
                }
            }

            if (env.BRANCH_NAME =~ "PR-*" ) {
                stage ('build container and push to ACR') {
                    container('docker') {
                        // Login to ACR
                        withCredentials([[$class          : 'UsernamePasswordMultiBinding', credentialsId: acrJenkinsCreds,
                                        usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
                            //println "DEBUG: docker login ${acrServer} -u ${env.USERNAME} -p ${env.PASSWORD}"
                            sh "docker login ${acrServer} -u ${env.USERNAME} -p ${env.PASSWORD}"
                        }

                        // build containers
                        sh "cd smackapi && docker build --build-arg BUILD_DATE='${buildDate}' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${env.GIT_SHA} -t ${apiImage} ."                    

                        // push images to repo (ACR)
                        def apiACRImage = acrServer + "/" + apiImage
                        sh "docker tag ${apiImage} ${apiACRImage}"
                        sh "docker push ${apiACRImage}"
                        sh "docker images" // for debug purposes
                    }
                    println "DEBUG: pushed image ${apiACRImage}"
                }

                stage ('deploy to kubernetes') {
                    container('helm') {
                        println "deploy PR image and add istio rules"
                        //sh "helm upgrade --install ${args.name} ${args.chart_dir} --set imageTag=${args.version_tag},replicas=${args.replicas},cpu=${args.cpu},memory=${args.memory},ingress.hostname=${args.hostname}"
                    }
                }
            }

            if (env.BRANCH_NAME == 'master') {
                stage ('build container and push to ACR') {
                    println "DEBUG: build and push containers stage starting"
                    container('docker') {
                        // Login to ACR
                        withCredentials([[$class          : 'UsernamePasswordMultiBinding', credentialsId: acrJenkinsCreds,
                                        usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
                            println "DEBUG: docker login ${acrServer} -u ${env.USERNAME} -p ${env.PASSWORD}"
                            sh "docker login ${acrServer} -u ${env.USERNAME} -p ${env.PASSWORD}"
                        }

                        // build containers
                        sh "cd smackapi && docker build --build-arg BUILD_DATE='${buildDate}' --build-arg IMAGE_TAG_REF=${imageTag} --build-arg VCS_REF=${env.GIT_SHA} -t ${apiImage} ."                    

                        // push images to repo (ACR)
                        def apiACRImage = acrServer + "/" + apiImage
                        sh "docker tag ${apiImage} ${apiACRImage}"
                        sh "docker push ${apiACRImage}"
                        println "DEBUG: pushed image ${apiACRImage}"

                        sh "docker images" // for debug purposes
                    }
                }

                stage ('deploy to kubernetes') {
                    container('helm') {
                        println "DEBUG: initiliazing helm"
                        sh "helm init"
                        sh "helm version"
                        
                        println "update release with new image and adjust istio rules"
                        sh "helm upgrade --install smackapi ./charts/smackapi --set image=briarprivate.azurecr.io/chzbrgr71/smackapi,imageTag=${imageTag},versionLabel=${imageTag},istio.precedence=50,istio.smackapiMasterTag=${imageTag}"
                    }
                }
            }         
        }
    }
