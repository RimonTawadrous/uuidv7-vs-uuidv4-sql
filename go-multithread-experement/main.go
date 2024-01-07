package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"

	"github.com/RimonTawadrous/uuidv7-vs-uuidv4-sql/intExprement"
	"github.com/RimonTawadrous/uuidv7-vs-uuidv4-sql/uuidv4"
	"github.com/RimonTawadrous/uuidv7-vs-uuidv4-sql/uuidv7"
	_ "github.com/go-sql-driver/mysql"
)

const (
	composeFile = "docker-compose.yml"
	volumeName  = "go-multithread-experement_mysql-db"

	dbConnectionString      = "user:password@tcp(localhost:13306)/db"
	numberOfRecordsToInsert = 100000
	numberOfWorkers         = 10
)

func waitMySQLReady() {
	fmt.Print("Waiting for MySQL service to be ready")
	// retry 10 times, waiting 30s between retries = 5 minutes total wait
	for i := 0; i < 10; i++ {
		db, err := sql.Open("mysql", dbConnectionString)
		defer db.Close()
		if err != nil {
		}
		err = db.Ping()
		if err == nil {
			return
		}
		time.Sleep(30 * time.Second)
	}
	log.Fatal("MySQL service is not responding")
}

func startDockerCompose() error {
	fmt.Println("Starting Docker Compose...")

	cmd := exec.Command("docker-compose", "-f", composeFile, "up", "-d")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		return err
	}

	waitMySQLReady()

	fmt.Println("Docker Compose started")

	return nil
}

func stopDockerCompose() {
	fmt.Println("Stopping Docker Compose...")

	cmd := exec.Command("docker-compose", "-f", composeFile, "down")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Docker Compose stopped")
	deleteDockerVolume()
	time.Sleep(1 * time.Second)
}

func deleteDockerVolume() {
	fmt.Println("Deleting Docker volume...")

	cmd := exec.Command("docker", "volume", "rm", "-f", volumeName)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Docker volume deleted")
}

func connectToDB() *sql.DB {
	db, err := sql.Open("mysql", dbConnectionString)
	if err != nil {
		log.Fatal(err)
	}
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	return db
}

func createTableWithIdUUIDBinary(db *sql.DB) {
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS orders (
			id BINARY(16) PRIMARY KEY,
			price DECIMAL(10,2) NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			user_id INT NOT NULL
		)`
	_, err := db.Exec(createTableQuery)
	if err != nil {
		log.Fatal("Error creating table with Int:", err)
	}
}

func createTableWithIdInt(db *sql.DB) {
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS orders (
			id INT PRIMARY KEY AUTO_INCREMENT,
			price DECIMAL(10,2) NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			user_id INT NOT NULL
		)`
	_, err := db.Exec(createTableQuery)
	if err != nil {
		log.Fatal("Error creating table with Int:", err)
	}
}

func doUUIDV4Experiment() (float64, int) {
	stopDockerCompose()
	startDockerCompose()

	db := connectToDB()
	defer db.Close()
	createTableWithIdUUIDBinary(db)

	fmt.Println("Starting UUIDV4 insertions....")
	uuidV4Experiment := uuidv4.UuidV4Experiment{}
	uuidV4Time, uuidV4CollesionCount := uuidV4Experiment.InsertRecords(db, numberOfRecordsToInsert, numberOfWorkers)
	return uuidV4Time, uuidV4CollesionCount
}

func doUUIDV7Experiment() (float64, int) {
	stopDockerCompose()
	startDockerCompose()
	db := connectToDB()
	defer db.Close()
	createTableWithIdUUIDBinary(db)

	fmt.Println("Starting UUIDV7 insertions....")
	uuidV7Experiment := uuidv7.UuidV7Experiment{}
	uuidV7Time, uuidV7CollesionCount := uuidV7Experiment.InsertRecords(db, numberOfRecordsToInsert, numberOfWorkers)

	return uuidV7Time, uuidV7CollesionCount
}

func doIntExperiment() (float64, int) {
	stopDockerCompose()
	startDockerCompose()

	db := connectToDB()
	defer db.Close()
	createTableWithIdInt(db)

	fmt.Println("Starting INT insertions....")
	intExperiment := intExprement.IntExprement{}
	intTime, intCollesionCount := intExperiment.InsertRecords(db, numberOfRecordsToInsert, numberOfWorkers)

	return intTime, intCollesionCount
}

func main() {
	fmt.Println("Starting experiment")

	fmt.Println("Cleaning up from previous runs...")
	fmt.Println("------------------------------------------------------------")

	fmt.Println("Starting UUIDV4 experiment...")
	uuidV4Time, uuidV4CollesionCount := doUUIDV4Experiment()
	fmt.Println("UUIDV4 experiment ended")

	fmt.Println("------------------------------------------------------------")

	fmt.Println("Starting UUIDV7 experiment...")
	uuidV7Time, uuidV7CollesionCount := doUUIDV7Experiment()
	fmt.Println("UUIDV7 experiment ended")

	fmt.Println("------------------------------------------------------------")

	fmt.Println("Starting INT experiment...")
	intTime, intCollesionCount := doIntExperiment()
	fmt.Println("INT experiment ended")
	fmt.Println("------------------------------------------------------------")

	stopDockerCompose()

	fmt.Println("UUIDV4:", uuidV4Time)
	fmt.Println("UUIDV7:", uuidV7Time)
	fmt.Println("INT:", intTime)
	fmt.Println("UUID V4 / UUID V7 percentage: ", float64(uuidV4Time)/float64(uuidV7Time))
	fmt.Println("UUIDV4 collision count:", uuidV4CollesionCount)
	fmt.Println("UUIDV7 collision count:", uuidV7CollesionCount)
	fmt.Println("INT collision count:", intCollesionCount)
	fmt.Println("Ending experiment")
}
