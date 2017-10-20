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
	var imageBuildDate = os.Getenv("IMAGE_BUILD_DATE")
	var kubeNodeName = os.Getenv("KUBE_NODE_NAME")
	var kubePodName = os.Getenv("KUBE_POD_NAME")
	var kubePodIP = os.Getenv("KUBE_POD_IP")

	var htmlHeader = "<!DOCTYPE html><html><head><style>table, th, td {border: 1px solid black;}th, td {padding: 15px;}</style></head><font color=black><h1>Microsmack Homepage</h1><body style=background-color:white>"
	fmt.Fprintf(w, htmlHeader)
	fmt.Fprintf(w, "<p>Git: %s<br>Image build date: %s<br>Kubernetes node: %s<br>Kubernetes pod name: %s<br>Kubernetes pod IP: %s</p><br>", gitSHA, imageBuildDate, kubeNodeName, kubePodName, kubePodIP)

	// loop through the api 9 times to build table
	fmt.Fprintf(w, "<table><tr><td>API1</td><td>API2</td><td>API3</td></tr><tr><td>API4</td><td>API5</td><td>API6</td></tr><tr><td>API7</td><td>API8</td><td>API9</td></tr></table>")

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
	log.Printf(backColor)
	//apiVersion := configObject.AppVersion

	// render footer
	fmt.Fprintf(w, "</body></html>")
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
