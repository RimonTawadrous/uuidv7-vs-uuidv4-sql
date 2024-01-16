# Project: uuidv7-vs-uuidv4-sql

## Introduction

Welcome to the `uuidv7-vs-uuidv4-sql` project! This experiment aims to benchmark the insertion time of millions of records into MySQL using two different UUID versions: UUIDv7 and UUIDv4. The project leverages both Node.js and Go programming languages for the experiment.

More info can be found @ https://medium.com/@rimonadel01/why-uuid7-is-better-than-uuid4-as-clustered-index-edb02bf70056

## System Requirements

- **Node Version:** 18 or later
- **Go Version:** 1.21.5 or later
- **Docker:** Installed and running
- **Docker Compose:** Installed and available

## Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/RimonTawadrous/uuidv7-vs-uuidv4-sql.git
cd uuidv7-vs-uuidv4-sql
```

### Step 2: Node.js Setup and Run

```bash
cd nodejs-single-thread-experiment
npm install
node experiment.js
```

### Step 3: Node.js Run

```bash
node experiment.js
```

### Step 4: Go Setup

```bash
cd go-multithread-experiment
go mod download
go build main.go && ./main --if
./main
```

### Step 5: Go Run

```bash
./main
```

<!--
# Connect to the database

# For UUIDv4
## Create chat_messages table
## Insert records and get time (sum of every insertion)

# Stop Docker & delete volume (Important to avoid affecting UUIDv7 insertions)
docker-compose down -v

# Wait 1 sec (let the system clean any swap)

# For UUIDv7
## Create chat_messages table
## Insert records and get time

# Stop Docker & delete volume

# Wait 1 sec

# For Integer
## Create chat_messages table
## Insert records and get time

# Stop Docker & delete volume

# Wait 1 sec -->
