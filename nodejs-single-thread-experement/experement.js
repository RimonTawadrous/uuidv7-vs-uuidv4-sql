const path = require("path");
const compose = require("docker-compose");
const { spawn } = require("child_process");
const mysql = require("mysql2/promise");
const uuidV4Experiment = require("./uuid4");
const uuidV7Experiment = require("./uuid7");
const intExperiment = require("./int");
const NUMBER_OF_RECORDS_TO_INSERT = 1000000;

const CONNECTION_CONFIGS = {
  host: "localhost",
  port: 13306,
  user: "user",
  password: "password",
  database: "db",
};

const volumeName = "nodejs-single-thread-experement_mysql-db"; // Replace with the actual volume name

async function startDocker() {
  console.log("Starting docker...");
  const dockerFileLocation = `${__dirname}`;
  await compose.upAll({
    cwd: dockerFileLocation,
    log: false,
  });
  await compose.ps({ cwd: path.join(__dirname) });
  await new Promise((done) => setTimeout(() => done(), 60000));
  console.log("Docker started");
}

async function stopDocker() {
  console.log("Stopping docker...");
  const dockerFileLocation = `${__dirname}`;
  await compose.down({ cwd: dockerFileLocation, log: false });
  await deleteDockervolume();
  // wait 1 min for OS cleanup resources
  await new Promise((done) => setTimeout(() => done(), 60000));
  console.log("Docker stopped");
}

async function deleteDockervolume() {
  try {
    const dockerRm = spawn("docker", ["volume", "rm", volumeName]);
    await new Promise((resolve) => dockerRm.on("close", resolve));
  } catch (e) {}
}

async function createTableWithIdUUIDBianry(connection) {
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BINARY(16) PRIMARY KEY,
        chat_id BINARY(16),
        sender_id BINARY(16),
        message VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`;
  return await connection.execute(createTableQuery);
}

function createTableWithIdInt(connection) {
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chat_id INT,
        sender_id INT,
        message VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`;
  return connection.execute(createTableQuery);
}

async function doUUIDV4Experiment() {
  await startDocker();
  const connection = await mysql.createConnection(CONNECTION_CONFIGS);
  await createTableWithIdUUIDBianry(connection);

  console.log("Starting UUIDV4 insertions....");
  const {
    totalMilliSeconds: uuidV4Time,
    collesionCount: uuidV4CollesionCount,
  } = await uuidV4Experiment.insertRecords(
    connection,
    NUMBER_OF_RECORDS_TO_INSERT
  );
  console.log(
    "UIID V4: Total insertion time",
    uuidV4Time,
    "collesion count",
    uuidV4CollesionCount
  );

  await stopDocker();
  return { uuidV4Time, uuidV4CollesionCount };
}

async function doUUIDV7Experiment() {
  await startDocker();
  const connection = await mysql.createConnection(CONNECTION_CONFIGS);
  await createTableWithIdUUIDBianry(connection);

  console.log("Starting UUIDV7 insertions.....");
  const {
    totalMilliSeconds: uuidV7Time,
    collesionCount: uuidV7CollesionCount,
  } = await uuidV7Experiment.insertRecords(
    connection,
    NUMBER_OF_RECORDS_TO_INSERT
  );

  console.log(
    "UIID V7: Total insertion time",
    uuidV7Time,
    "collesion count",
    uuidV7CollesionCount
  );

  await stopDocker();
  return { uuidV7Time, uuidV7CollesionCount };
}

async function doIntExperiment() {
  await startDocker();
  const connection = await mysql.createConnection(CONNECTION_CONFIGS);
  await createTableWithIdInt(connection);

  console.log("Starting INT insertions....");
  const { totalMilliSeconds: intTime, collesionCount: intCollesionCount } =
    await intExperiment.insertRecords(connection, NUMBER_OF_RECORDS_TO_INSERT);

  console.log(
    "Int Id: Total insertion time",
    intTime,
    "collesion count",
    intCollesionCount
  );

  await stopDocker();
  return { intTime, intCollesionCount };
}

async function doExperement() {
  console.log("Starting experement");

  console.log("Cleaning from only runs......");
  await stopDocker();
  console.log("------------------------------------------------------------\n");

  console.log("Starting UUIDV4 experiment......");
  const { uuidV4Time, uuidV4CollesionCount } = await doUUIDV4Experiment();
  console.log("UUIDV4 experiment ended");

  console.log("------------------------------------------------------------\n");

  console.log("Starting UUIDV7 experiment.......");
  const { uuidV7Time, uuidV7CollesionCount } = await doUUIDV7Experiment();
  console.log("UUIDV7 experiment ended");

  console.log("------------------------------------------------------------\n");

  console.log("Starting INT experiment.......");
  const { intTime, intCollesionCount } = await doIntExperiment();
  console.log("INT experiment ended");
  console.log("------------------------------------------------------------\n");

  console.log("UUIDV4:", uuidV4Time);
  console.log("UUIDV7:", uuidV7Time);
  console.log("INT:", intTime);
  console.log("UUID V4 / UUID V7 persentage: ", uuidV4Time / uuidV7Time);
  console.log("UUIDV4 collesion count:", uuidV4CollesionCount);
  console.log("UUIDV7 collesion count:", uuidV7CollesionCount);
  console.log("INT collesion count:", intCollesionCount);
  console.log("Ending experement");
}

doExperement();
