package intExprement

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const insertQuery = "INSERT INTO orders (price, user_id) VALUES (?, ?)"

type IntExprement struct {
}

type WorkerResult struct {
	TotalMilliSeconds float64
	CollesionCount    int
}

func (this *IntExprement) InsertRecords(db *sql.DB, count int, numWorkers int) (float64, int) {
	done := make(chan struct{})                        // Channel to signal completion of each worker
	resultsChan := make(chan WorkerResult, numWorkers) // Channel to communicate results from workers
	var wg sync.WaitGroup                              // Use a WaitGroup to wait for all workers to finish

	// Launch worker goroutines
	for workerIndex := 0; workerIndex < numWorkers; workerIndex++ {
		wg.Add(1)
		go this.worker(db, count/numWorkers, workerIndex, done, resultsChan, &wg)
	}

	go func() {
		wg.Wait()
		close(done)
		close(resultsChan)
	}()

	var totalMilliSeconds float64
	var totalCollesionCount int
	for result := range resultsChan {
		totalMilliSeconds += result.TotalMilliSeconds
		totalCollesionCount += result.CollesionCount
	}

	fmt.Println("All records inserted successfully!")
	return totalMilliSeconds, totalCollesionCount

}

func (this *IntExprement) worker(db *sql.DB, count int, workerIndex int, done chan struct{}, resultsChan chan WorkerResult, wg *sync.WaitGroup) {
	defer wg.Done()
	var collesionCount int
	var totalMilliSeconds float64
	var totalRecords int
	var periodInsertionMiliSecondsSum float64
	var insertionTime float64
	var startTime, endTime time.Time

	for i := 0; i <= count; i++ {
		price := rand.Float64() * 100 // Generate random price
		userID := rand.Intn(100) + 1  // Assuming 100 users

		startTime = time.Now()
		_, err := db.Exec(insertQuery, price, userID)
		if err != nil {
			// Rollback in case of errors
			db.Exec("ROLLBACK")
			collesionCount++
			log.Println("rolling back", err)
		}

		endTime = time.Now()
		insertionTime = endTime.Sub(startTime).Seconds() * 1000
		periodInsertionMiliSecondsSum += insertionTime
		totalMilliSeconds += insertionTime

		totalRecords++
		if i > 0 && i%10000 == 0 {
			fmt.Printf("worker %d UUIDV4: Inserted 10000 records in %.2fms %d/%d\n", workerIndex, periodInsertionMiliSecondsSum, i, count)
			periodInsertionMiliSecondsSum = 0
		}
	}
	resultsChan <- WorkerResult{TotalMilliSeconds: totalMilliSeconds, CollesionCount: collesionCount}
}
