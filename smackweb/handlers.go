package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

type Config struct {
	Key          string `json:"Key"`
	BackColor    string `json:"BackColor"`
	AppVersion   string `json:"AppVersion"`
	BuildDate    string `json:"BuildDate"`
	KubeNodeName string `json:"KubeNodeName"`
	KubePodName  string `json:"KubePodName"`
	KubePodIP    string `json:"KubePodIP"`
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	// gather values
	var gitSHA = os.Getenv("GIT_SHA")
	//var appVersion = os.Getenv("APP_VERSION")
	var appVersion = "v1"
	var imageBuildDate = os.Getenv("IMAGE_BUILD_DATE")
	var kubeNodeName = os.Getenv("KUBE_NODE_NAME")
	var kubePodName = os.Getenv("KUBE_POD_NAME")
	var kubePodIP = os.Getenv("KUBE_POD_IP")

	// call api for backend config values
	var apiService = os.Getenv("API_SERVICE")
	if len(apiService) == 0 {
		apiService = "localhost"
	}
	var apiPort = os.Getenv("API_PORT")
	if len(apiPort) == 0 {
		apiPort = "8081"
	}
	url := "http://" + apiService + ":" + apiPort + "/getconfig"
	response, err := http.Get(url)
	if err != nil {
		log.Fatal(err)
		//log.Print(err)
	}
	defer response.Body.Close()
	responseData, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf(string(responseData))
	var configObject Config
	json.Unmarshal(responseData, &configObject)
	backColor := configObject.BackColor
	apiVersion := configObject.AppVersion
	apiBuildDate := configObject.BuildDate
	apiKubeNodeName := configObject.KubeNodeName
	apiKubePodName := configObject.KubePodName
	apiKubePodIP := configObject.KubePodIP

	// render page
	html := fmt.Sprintf("<!DOCTYPE html><html><font color=white><h1>Microsmack Homepage</h1><body style=background-color:%s><p>Git: %s<br>App version: %s<br>Image build date: %s</p><p>Kubernetes node: %s<br>Kubernetes pod name: %s<br>Kubernetes pod IP: %s</p><p>------------</p><p>Backend API (Version %s):<br>API build date: %s<br>API kubernetes node: %s<br>API kubernetes pod: %s<br>API kubernetes IP: %s</p></body></html>", backColor, gitSHA, appVersion, imageBuildDate, kubeNodeName, kubePodName, kubePodIP, apiVersion, apiBuildDate, apiKubeNodeName, apiKubePodName, apiKubePodIP)
	fmt.Fprintf(w, html)
}

func testHandler(resp http.ResponseWriter, req *http.Request) {
	resp.Header().Add("Content-Type", "text/html")
	resp.WriteHeader(http.StatusOK)
	fmt.Fprint(resp, "RUNNING")
}

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	// A very simple health check
	w.WriteHeader(http.StatusOK)
	//w.WriteHeader(http.StatusBadGateway)
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, `{"alive": true}`)
}
