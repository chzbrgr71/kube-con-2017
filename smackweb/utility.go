package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

func getBackColor() string {
	// call api for background color
	var apiService = os.Getenv("API_SERVICE")
	if len(apiService) == 0 {
		apiService = "localhost"
	}
	var apiPort = os.Getenv("API_PORT")
	if len(apiPort) == 0 {
		apiPort = "8081"
	}
	url := "http://" + apiService + ":" + apiPort + "/getcolor"

	response, err := http.Get(url)
	if err != nil {
		// if we get an error, default page to a set color
		return "powderblue"
	}

	defer response.Body.Close()

	responseData, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf(string(responseData))

	var configObject Config
	json.Unmarshal(responseData, &configObject)

	value := "configObject.Value"

	return value

}

func getHostname() string {
	var result string
	localhostname, err := os.Hostname()

	if err != nil {
		result = "ERROR: Cannot find server hostname"
	} else {
		result = localhostname
	}
	return result
}
