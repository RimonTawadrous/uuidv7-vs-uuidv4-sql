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





// Starting experement
// Cleaning from only runs......
// Stopping docker...
// Docker stopped
// ------------------------------------------------------------

// Starting UUIDV4 experiment......
// Starting docker...
// Docker started
// Starting UUIDV4 insertions....
// UUIDV4: Inserted 10000 records in 145487.03230900073ms  10000/1000000
// UUIDV4: Inserted 10000 records in 167938.29882399656ms  20000/1000000
// UUIDV4: Inserted 10000 records in 237503.0238040113ms  30000/1000000
// UUIDV4: Inserted 10000 records in 237183.35113600153ms  40000/1000000
// UUIDV4: Inserted 10000 records in 237413.0227619995ms  50000/1000000
// UUIDV4: Inserted 10000 records in 237806.6711969846ms  60000/1000000
// UUIDV4: Inserted 10000 records in 240086.76186801773ms  70000/1000000
// UUIDV4: Inserted 10000 records in 239164.729669007ms  80000/1000000
// UUIDV4: Inserted 10000 records in 233925.87043999834ms  90000/1000000
// UUIDV4: Inserted 10000 records in 240202.86086502904ms  100000/1000000
// UUIDV4: Inserted 10000 records in 241791.38234498678ms  110000/1000000
// UUIDV4: Inserted 10000 records in 243082.47071300726ms  120000/1000000
// UUIDV4: Inserted 10000 records in 243402.42489999905ms  130000/1000000
// UUIDV4: Inserted 10000 records in 244926.36472998ms  140000/1000000
// UUIDV4: Inserted 10000 records in 244642.3248899812ms  150000/1000000
// UUIDV4: Inserted 10000 records in 244643.27990701376ms  160000/1000000
// UUIDV4: Inserted 10000 records in 245710.12652999116ms  170000/1000000
// UUIDV4: Inserted 10000 records in 244883.64683792274ms  180000/1000000
// UUIDV4: Inserted 10000 records in 244903.00845900923ms  190000/1000000
// UUIDV4: Inserted 10000 records in 244296.34947998263ms  200000/1000000
// UUIDV4: Inserted 10000 records in 245421.05698897783ms  210000/1000000
// UUIDV4: Inserted 10000 records in 246465.73267097212ms  220000/1000000
// UUIDV4: Inserted 10000 records in 244815.9916400062ms  230000/1000000
// UUIDV4: Inserted 10000 records in 245011.01497899462ms  240000/1000000
// UUIDV4: Inserted 10000 records in 245191.04558503907ms  250000/1000000
// UUIDV4: Inserted 10000 records in 244122.07712494954ms  260000/1000000
// UUIDV4: Inserted 10000 records in 243879.72595401853ms  270000/1000000
// UUIDV4: Inserted 10000 records in 244933.52850997448ms  280000/1000000
// UUIDV4: Inserted 10000 records in 245171.93464798853ms  290000/1000000
// UUIDV4: Inserted 10000 records in 244980.00970907416ms  300000/1000000
// UUIDV4: Inserted 10000 records in 244409.4516539639ms  310000/1000000
// UUIDV4: Inserted 10000 records in 245794.04468295816ms  320000/1000000
// UUIDV4: Inserted 10000 records in 245743.77869795915ms  330000/1000000
// UUIDV4: Inserted 10000 records in 245065.30520604644ms  340000/1000000
// UUIDV4: Inserted 10000 records in 244031.0213670535ms  350000/1000000
// UUIDV4: Inserted 10000 records in 244985.64689907432ms  360000/1000000
// UUIDV4: Inserted 10000 records in 245716.26284594834ms  370000/1000000
// UUIDV4: Inserted 10000 records in 245269.15163689665ms  380000/1000000
// UUIDV4: Inserted 10000 records in 245015.82130899467ms  390000/1000000
// UUIDV4: Inserted 10000 records in 245954.80124604888ms  400000/1000000
// UUIDV4: Inserted 10000 records in 244583.73886093497ms  410000/1000000
// UUIDV4: Inserted 10000 records in 245648.83732707053ms  420000/1000000
// UUIDV4: Inserted 10000 records in 245198.61218800955ms  430000/1000000
// UUIDV4: Inserted 10000 records in 244905.25175599754ms  440000/1000000
// UUIDV4: Inserted 10000 records in 245621.99105489254ms  450000/1000000
// UUIDV4: Inserted 10000 records in 245338.3391550593ms  460000/1000000
// UUIDV4: Inserted 10000 records in 245016.36542203277ms  470000/1000000
// UUIDV4: Inserted 10000 records in 244720.95891081728ms  480000/1000000
// UUIDV4: Inserted 10000 records in 245936.72055299766ms  490000/1000000
// UUIDV4: Inserted 10000 records in 245786.63428496197ms  500000/1000000
// UUIDV4: Inserted 10000 records in 244446.15503700264ms  510000/1000000
// UUIDV4: Inserted 10000 records in 246352.97759790905ms  520000/1000000
// UUIDV4: Inserted 10000 records in 245914.88584888913ms  530000/1000000
// UUIDV4: Inserted 10000 records in 245728.28033007495ms  540000/1000000
// UUIDV4: Inserted 10000 records in 245330.11479801685ms  550000/1000000
// UUIDV4: Inserted 10000 records in 246663.18205404468ms  560000/1000000
// UUIDV4: Inserted 10000 records in 246055.43622896262ms  570000/1000000
// UUIDV4: Inserted 10000 records in 245695.64100200497ms  580000/1000000
// UUIDV4: Inserted 10000 records in 247264.59429290146ms  590000/1000000
// UUIDV4: Inserted 10000 records in 244380.78384091146ms  600000/1000000
// UUIDV4: Inserted 10000 records in 246542.02494212985ms  610000/1000000
// UUIDV4: Inserted 10000 records in 247517.0794251021ms  620000/1000000
// UUIDV4: Inserted 10000 records in 246924.46720610373ms  630000/1000000
// UUIDV4: Inserted 10000 records in 247286.9449490048ms  640000/1000000
// UUIDV4: Inserted 10000 records in 246846.80742498115ms  650000/1000000
// UUIDV4: Inserted 10000 records in 247464.65244094655ms  660000/1000000
// UUIDV4: Inserted 10000 records in 247290.88921692036ms  670000/1000000
// UUIDV4: Inserted 10000 records in 246170.74372410402ms  680000/1000000
// UUIDV4: Inserted 10000 records in 246376.21754600108ms  690000/1000000
// UUIDV4: Inserted 10000 records in 247549.6124270782ms  700000/1000000
// UUIDV4: Inserted 10000 records in 247155.53613197058ms  710000/1000000
// UUIDV4: Inserted 10000 records in 246497.634525802ms  720000/1000000
// UUIDV4: Inserted 10000 records in 247183.74457215145ms  730000/1000000
// UUIDV4: Inserted 10000 records in 246865.55991709232ms  740000/1000000
// UUIDV4: Inserted 10000 records in 246546.21707494184ms  750000/1000000
// UUIDV4: Inserted 10000 records in 248566.209602803ms  760000/1000000
// UUIDV4: Inserted 10000 records in 247813.64072309807ms  770000/1000000
// UUIDV4: Inserted 10000 records in 247229.25715608522ms  780000/1000000
// UUIDV4: Inserted 10000 records in 247578.3473599851ms  790000/1000000
// UUIDV4: Inserted 10000 records in 247898.54780204222ms  800000/1000000
// UUIDV4: Inserted 10000 records in 247181.11947901174ms  810000/1000000
// UUIDV4: Inserted 10000 records in 247361.65463206545ms  820000/1000000
// UUIDV4: Inserted 10000 records in 246402.79509298503ms  830000/1000000
// UUIDV4: Inserted 10000 records in 246288.96039178222ms  840000/1000000
// UUIDV4: Inserted 10000 records in 241777.65587195754ms  850000/1000000
// UUIDV4: Inserted 10000 records in 243502.78604512662ms  860000/1000000
// UUIDV4: Inserted 10000 records in 246864.71788484603ms  870000/1000000
// UUIDV4: Inserted 10000 records in 247762.16874402761ms  880000/1000000
// UUIDV4: Inserted 10000 records in 247232.69934387878ms  890000/1000000
// UUIDV4: Inserted 10000 records in 246716.89626011997ms  900000/1000000
// UUIDV4: Inserted 10000 records in 247312.18189886585ms  910000/1000000
// UUIDV4: Inserted 10000 records in 247011.24157081544ms  920000/1000000
// UUIDV4: Inserted 10000 records in 246810.38578119874ms  930000/1000000
// UUIDV4: Inserted 10000 records in 246501.7823729068ms  940000/1000000
// UUIDV4: Inserted 10000 records in 247611.95007296652ms  950000/1000000
// UUIDV4: Inserted 10000 records in 243248.61841404065ms  960000/1000000
// UUIDV4: Inserted 10000 records in 247625.32540797815ms  970000/1000000
// UUIDV4: Inserted 10000 records in 247403.76905559376ms  980000/1000000
// UUIDV4: Inserted 10000 records in 248110.83849215508ms  990000/1000000
// UUIDV4: Inserted 10000 records in 247746.81983705983ms  1000000/1000000
// All records inserted successfully!
// UIID V4: Total insertion time 24345338.406382076 collesion count 0
// Stopping docker...
// Docker stopped
// UUIDV4 experiment ended
// ------------------------------------------------------------

// Starting UUIDV7 experiment.......
// Starting docker...
// Docker started
// Starting UUIDV7 insertions.....
// UUIDV7: Inserted 10000 records in 143704.96187805757ms  10000/1000000
// UUIDV7: Inserted 10000 records in 165437.1946909912ms  20000/1000000
// UUIDV7: Inserted 10000 records in 237625.2506031096ms  30000/1000000
// UUIDV7: Inserted 10000 records in 229749.3560680896ms  40000/1000000
// UUIDV7: Inserted 10000 records in 235457.70865805447ms  50000/1000000
// UUIDV7: Inserted 10000 records in 237924.09705208987ms  60000/1000000
// UUIDV7: Inserted 10000 records in 239556.23245896026ms  70000/1000000
// UUIDV7: Inserted 10000 records in 238771.96181923896ms  80000/1000000
// UUIDV7: Inserted 10000 records in 240656.4501159303ms  90000/1000000
// UUIDV7: Inserted 10000 records in 238141.6676360257ms  100000/1000000
// UUIDV7: Inserted 10000 records in 239113.65408901498ms  110000/1000000
// UUIDV7: Inserted 10000 records in 230460.3641465865ms  120000/1000000
// UUIDV7: Inserted 10000 records in 230437.47234410793ms  130000/1000000
// UUIDV7: Inserted 10000 records in 229818.06058998033ms  140000/1000000
// UUIDV7: Inserted 10000 records in 230149.71971898153ms  150000/1000000
// UUIDV7: Inserted 10000 records in 230814.52691605687ms  160000/1000000
// UUIDV7: Inserted 10000 records in 231358.77083812654ms  170000/1000000
// UUIDV7: Inserted 10000 records in 231526.40248509496ms  180000/1000000
// UUIDV7: Inserted 10000 records in 230123.07722987235ms  190000/1000000
// UUIDV7: Inserted 10000 records in 230584.01077985764ms  200000/1000000
// UUIDV7: Inserted 10000 records in 230563.49495295063ms  210000/1000000
// UUIDV7: Inserted 10000 records in 231311.6008238457ms  220000/1000000
// UUIDV7: Inserted 10000 records in 239249.33978012204ms  230000/1000000
// UUIDV7: Inserted 10000 records in 238672.96143017337ms  240000/1000000
// UUIDV7: Inserted 10000 records in 239214.94975669682ms  250000/1000000
// UUIDV7: Inserted 10000 records in 239609.2490621917ms  260000/1000000
// UUIDV7: Inserted 10000 records in 238321.63975183666ms  270000/1000000
// UUIDV7: Inserted 10000 records in 238448.01205901057ms  280000/1000000
// UUIDV7: Inserted 10000 records in 239180.1777659543ms  290000/1000000
// UUIDV7: Inserted 10000 records in 239452.87592758983ms  300000/1000000
// UUIDV7: Inserted 10000 records in 239452.09970714897ms  310000/1000000
// UUIDV7: Inserted 10000 records in 239461.8202120401ms  320000/1000000
// UUIDV7: Inserted 10000 records in 236513.05896000564ms  330000/1000000
// UUIDV7: Inserted 10000 records in 238645.901644893ms  340000/1000000
// UUIDV7: Inserted 10000 records in 238017.17085795477ms  350000/1000000
// UUIDV7: Inserted 10000 records in 237942.205413796ms  360000/1000000
// UUIDV7: Inserted 10000 records in 238389.81510698423ms  370000/1000000
// UUIDV7: Inserted 10000 records in 239578.62209013477ms  380000/1000000
// UUIDV7: Inserted 10000 records in 239090.38486283645ms  390000/1000000
// UUIDV7: Inserted 10000 records in 239381.891820468ms  400000/1000000
// UUIDV7: Inserted 10000 records in 238521.01871757954ms  410000/1000000
// UUIDV7: Inserted 10000 records in 238591.89473819733ms  420000/1000000
// UUIDV7: Inserted 10000 records in 238505.0520279035ms  430000/1000000
// UUIDV7: Inserted 10000 records in 238239.25896992534ms  440000/1000000
// UUIDV7: Inserted 10000 records in 238736.47974695265ms  450000/1000000
// UUIDV7: Inserted 10000 records in 238826.68646404147ms  460000/1000000
// UUIDV7: Inserted 10000 records in 237783.98208568245ms  470000/1000000
// UUIDV7: Inserted 10000 records in 238229.4588741362ms  480000/1000000
// UUIDV7: Inserted 10000 records in 238294.69855190814ms  490000/1000000
// UUIDV7: Inserted 10000 records in 238082.8318090886ms  500000/1000000
// UUIDV7: Inserted 10000 records in 237699.14789693803ms  510000/1000000
// UUIDV7: Inserted 10000 records in 238489.12720892578ms  520000/1000000
// UUIDV7: Inserted 10000 records in 237960.38163491338ms  530000/1000000
// UUIDV7: Inserted 10000 records in 237823.27097532898ms  540000/1000000
// UUIDV7: Inserted 10000 records in 238838.60063450038ms  550000/1000000
// UUIDV7: Inserted 10000 records in 237504.28152196854ms  560000/1000000
// UUIDV7: Inserted 10000 records in 239366.86585917324ms  570000/1000000
// UUIDV7: Inserted 10000 records in 236875.60720116645ms  580000/1000000
// UUIDV7: Inserted 10000 records in 237445.4994007796ms  590000/1000000
// UUIDV7: Inserted 10000 records in 237341.63032919168ms  600000/1000000
// UUIDV7: Inserted 10000 records in 237421.23465067148ms  610000/1000000
// UUIDV7: Inserted 10000 records in 237075.15338096768ms  620000/1000000
// UUIDV7: Inserted 10000 records in 238160.19241965562ms  630000/1000000
// UUIDV7: Inserted 10000 records in 237514.50274318457ms  640000/1000000
// UUIDV7: Inserted 10000 records in 237474.84064744413ms  650000/1000000
// UUIDV7: Inserted 10000 records in 240271.00888590515ms  660000/1000000
// UUIDV7: Inserted 10000 records in 237620.6419138685ms  670000/1000000
// UUIDV7: Inserted 10000 records in 238260.85005610436ms  680000/1000000
// UUIDV7: Inserted 10000 records in 238566.95647507906ms  690000/1000000
// UUIDV7: Inserted 10000 records in 237939.55053625256ms  700000/1000000
// UUIDV7: Inserted 10000 records in 237912.4720607996ms  710000/1000000
// UUIDV7: Inserted 10000 records in 237737.10656617582ms  720000/1000000
// UUIDV7: Inserted 10000 records in 237560.211084567ms  730000/1000000
// UUIDV7: Inserted 10000 records in 236832.53521488607ms  740000/1000000
// UUIDV7: Inserted 10000 records in 236421.1678488031ms  750000/1000000
// UUIDV7: Inserted 10000 records in 238002.68880625814ms  760000/1000000
// UUIDV7: Inserted 10000 records in 238026.14777361602ms  770000/1000000
// UUIDV7: Inserted 10000 records in 237234.86486905813ms  780000/1000000
// UUIDV7: Inserted 10000 records in 236986.36988565326ms  790000/1000000
// UUIDV7: Inserted 10000 records in 238421.8889382258ms  800000/1000000
// UUIDV7: Inserted 10000 records in 238336.63484692574ms  810000/1000000
// UUIDV7: Inserted 10000 records in 237971.422272861ms  820000/1000000
// UUIDV7: Inserted 10000 records in 238451.26060466468ms  830000/1000000
// UUIDV7: Inserted 10000 records in 238830.18341385573ms  840000/1000000
// UUIDV7: Inserted 10000 records in 238877.48822578043ms  850000/1000000
// UUIDV7: Inserted 10000 records in 238389.608382456ms  860000/1000000
// UUIDV7: Inserted 10000 records in 237965.55645638704ms  870000/1000000
// UUIDV7: Inserted 10000 records in 238706.12008640915ms  880000/1000000
// UUIDV7: Inserted 10000 records in 238939.9334819615ms  890000/1000000
// UUIDV7: Inserted 10000 records in 237347.1166086048ms  900000/1000000
// UUIDV7: Inserted 10000 records in 238325.35882709175ms  910000/1000000
// UUIDV7: Inserted 10000 records in 238321.10028009862ms  920000/1000000
// UUIDV7: Inserted 10000 records in 239452.209602274ms  930000/1000000
// UUIDV7: Inserted 10000 records in 240158.28435251862ms  940000/1000000
// UUIDV7: Inserted 10000 records in 239517.8439994976ms  950000/1000000
// UUIDV7: Inserted 10000 records in 239817.7017613873ms  960000/1000000
// UUIDV7: Inserted 10000 records in 238962.05618139356ms  970000/1000000
// UUIDV7: Inserted 10000 records in 240380.33400597423ms  980000/1000000
// UUIDV7: Inserted 10000 records in 240656.8063684106ms  990000/1000000
// UUIDV7: Inserted 10000 records in 239928.96561469883ms  1000000/1000000
// All records inserted successfully!
// UIID V7: Total insertion time 23579840.35688359 collesion count 0
// Stopping docker...
// Docker stopped
// UUIDV7 experiment ended
// ------------------------------------------------------------

// Starting INT experiment.......
// Starting docker...
// Docker started
// Starting INT insertions....
// Int Id: Inserted 10000 records in 144701.62475919724ms  10000/1000000
// Int Id: Inserted 10000 records in 162555.16733204573ms  20000/1000000
// Int Id: Inserted 10000 records in 236296.24874214828ms  30000/1000000
// Int Id: Inserted 10000 records in 239534.33891111612ms  40000/1000000
// Int Id: Inserted 10000 records in 237598.36136444658ms  50000/1000000
// Int Id: Inserted 10000 records in 237514.72311013192ms  60000/1000000
// Int Id: Inserted 10000 records in 237170.69277029485ms  70000/1000000
// Int Id: Inserted 10000 records in 238720.93969521672ms  80000/1000000
// Int Id: Inserted 10000 records in 237398.71052113175ms  90000/1000000
// Int Id: Inserted 10000 records in 237742.89277935028ms  100000/1000000
// Int Id: Inserted 10000 records in 238101.28691277653ms  110000/1000000
// Int Id: Inserted 10000 records in 236952.25319055468ms  120000/1000000
// Int Id: Inserted 10000 records in 236415.50769919902ms  130000/1000000
// Int Id: Inserted 10000 records in 237295.52222964913ms  140000/1000000
// Int Id: Inserted 10000 records in 238418.26262502372ms  150000/1000000
// Int Id: Inserted 10000 records in 237515.93878462166ms  160000/1000000
// Int Id: Inserted 10000 records in 238000.59535814822ms  170000/1000000
// Int Id: Inserted 10000 records in 239532.09015797824ms  180000/1000000
// Int Id: Inserted 10000 records in 238904.38323513418ms  190000/1000000
// Int Id: Inserted 10000 records in 239355.16884946823ms  200000/1000000
// Int Id: Inserted 10000 records in 237471.7327016145ms  210000/1000000
// Int Id: Inserted 10000 records in 238675.3363354653ms  220000/1000000
// Int Id: Inserted 10000 records in 239229.8907130286ms  230000/1000000
// Int Id: Inserted 10000 records in 238288.88686119765ms  240000/1000000
// Int Id: Inserted 10000 records in 238962.78018511832ms  250000/1000000
// Int Id: Inserted 10000 records in 238730.46353317797ms  260000/1000000
// Int Id: Inserted 10000 records in 239366.9046979919ms  270000/1000000
// Int Id: Inserted 10000 records in 238707.0185295716ms  280000/1000000
// Int Id: Inserted 10000 records in 238999.8083924502ms  290000/1000000
// Int Id: Inserted 10000 records in 238505.32852075994ms  300000/1000000
// Int Id: Inserted 10000 records in 238644.43291402608ms  310000/1000000
// Int Id: Inserted 10000 records in 237615.46771368384ms  320000/1000000
// Int Id: Inserted 10000 records in 238219.56616584212ms  330000/1000000
// Int Id: Inserted 10000 records in 238350.2392884791ms  340000/1000000
// Int Id: Inserted 10000 records in 236700.91452344507ms  350000/1000000
// Int Id: Inserted 10000 records in 236984.81487382948ms  360000/1000000
// Int Id: Inserted 10000 records in 238050.59347099066ms  370000/1000000
// Int Id: Inserted 10000 records in 237905.6545289606ms  380000/1000000
// Int Id: Inserted 10000 records in 237191.6723544374ms  390000/1000000
// Int Id: Inserted 10000 records in 237298.49892451614ms  400000/1000000
// Int Id: Inserted 10000 records in 238506.64450757205ms  410000/1000000
// Int Id: Inserted 10000 records in 237816.37350651622ms  420000/1000000
// Int Id: Inserted 10000 records in 238708.18899879605ms  430000/1000000
// Int Id: Inserted 10000 records in 236817.52310606092ms  440000/1000000
// Int Id: Inserted 10000 records in 237332.65607806295ms  450000/1000000
// Int Id: Inserted 10000 records in 236551.10190576315ms  460000/1000000
// Int Id: Inserted 10000 records in 238852.8748402819ms  470000/1000000
// Int Id: Inserted 10000 records in 238204.36336253583ms  480000/1000000
// Int Id: Inserted 10000 records in 238307.7815027386ms  490000/1000000
// Int Id: Inserted 10000 records in 236738.48027314246ms  500000/1000000
// Int Id: Inserted 10000 records in 238266.67484761775ms  510000/1000000
// Int Id: Inserted 10000 records in 237514.68619281054ms  520000/1000000
// Int Id: Inserted 10000 records in 237104.59834124893ms  530000/1000000
// Int Id: Inserted 10000 records in 236886.8023460135ms  540000/1000000
// Int Id: Inserted 10000 records in 238463.81463382393ms  550000/1000000
// Int Id: Inserted 10000 records in 237141.32050049305ms  560000/1000000
// Int Id: Inserted 10000 records in 238044.07168457657ms  570000/1000000
// Int Id: Inserted 10000 records in 238068.63581059873ms  580000/1000000
// Int Id: Inserted 10000 records in 238007.0509199053ms  590000/1000000
// Int Id: Inserted 10000 records in 237677.1953630224ms  600000/1000000
// Int Id: Inserted 10000 records in 238464.90595929325ms  610000/1000000
// Int Id: Inserted 10000 records in 239097.50164802372ms  620000/1000000
// Int Id: Inserted 10000 records in 239088.870916605ms  630000/1000000
// Int Id: Inserted 10000 records in 237172.2549142465ms  640000/1000000
// Int Id: Inserted 10000 records in 239173.20294980705ms  650000/1000000
// Int Id: Inserted 10000 records in 241102.35253749043ms  660000/1000000
// Int Id: Inserted 10000 records in 240054.27319885045ms  670000/1000000
// Int Id: Inserted 10000 records in 238849.18283426017ms  680000/1000000
// Int Id: Inserted 10000 records in 237328.40958476067ms  690000/1000000
// Int Id: Inserted 10000 records in 238265.8679819405ms  700000/1000000
// Int Id: Inserted 10000 records in 240866.48053711653ms  710000/1000000
// Int Id: Inserted 10000 records in 239756.8313895613ms  720000/1000000
// Int Id: Inserted 10000 records in 239975.04583465308ms  730000/1000000
// Int Id: Inserted 10000 records in 240558.26372147352ms  740000/1000000
// Int Id: Inserted 10000 records in 239855.10601399094ms  750000/1000000
// Int Id: Inserted 10000 records in 239922.46918927878ms  760000/1000000
// Int Id: Inserted 10000 records in 240505.903875947ms  770000/1000000
// Int Id: Inserted 10000 records in 239307.72094230354ms  780000/1000000
// Int Id: Inserted 10000 records in 238638.4447831139ms  790000/1000000
// Int Id: Inserted 10000 records in 238124.6437869817ms  800000/1000000
// Int Id: Inserted 10000 records in 238297.44456414878ms  810000/1000000
// Int Id: Inserted 10000 records in 237904.92501288652ms  820000/1000000
// Int Id: Inserted 10000 records in 236557.74271389842ms  830000/1000000
// Int Id: Inserted 10000 records in 238545.10098600388ms  840000/1000000
// Int Id: Inserted 10000 records in 238145.19259639084ms  850000/1000000
// Int Id: Inserted 10000 records in 240170.28544923663ms  860000/1000000
// Int Id: Inserted 10000 records in 240900.494419083ms  870000/1000000
// Int Id: Inserted 10000 records in 240076.20208837092ms  880000/1000000
// Int Id: Inserted 10000 records in 241714.7168903798ms  890000/1000000
// Int Id: Inserted 10000 records in 240942.52534653246ms  900000/1000000
// Int Id: Inserted 10000 records in 241216.1486621797ms  910000/1000000
// Int Id: Inserted 10000 records in 240555.50874638557ms  920000/1000000
// Int Id: Inserted 10000 records in 239939.5313091427ms  930000/1000000
// Int Id: Inserted 10000 records in 238462.4393493086ms  940000/1000000
// Int Id: Inserted 10000 records in 237741.60006602108ms  950000/1000000
// Int Id: Inserted 10000 records in 238089.6175351143ms  960000/1000000
// Int Id: Inserted 10000 records in 238492.17257130146ms  970000/1000000
// Int Id: Inserted 10000 records in 238777.99799010158ms  980000/1000000
// Int Id: Inserted 10000 records in 238361.71615982056ms  990000/1000000
// Int Id: Inserted 10000 records in 238680.5467081219ms  1000000/1000000
// All records inserted successfully!
// Int Id: Total insertion time 23678315.194741927 collesion count 0
// Stopping docker...
// Docker stopped
// INT experiment ended
// ------------------------------------------------------------

// UUIDV4: 24345338.406382076
// UUIDV7: 23579840.35688359
// INT: 23678315.194741927
// UUID V4 / UUID V7 persentage:  1.0324640895745087
// UUIDV4 collesion count: 0
// UUIDV7 collesion count: 0
// INT collesion count: 0
// Ending experement