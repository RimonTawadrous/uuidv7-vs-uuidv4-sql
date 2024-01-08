const { uuidv7 } = require("uuidv7");

let totalMilliSeconds = 0.0;
let collesionCount = 0;
async function insertRecords(connection, count) {
  let totalRecords = 0;
  let periodInsertionMiliSecondsSum = 0;
  let insertionTime;
  let startTime;
  let endTime;
  for (let i = 0; i <= count; i++) {
    const insertQuery = `INSERT INTO orders (id, price, user_id) VALUES (UNHEX(?), ?, ?)`;
    let id = uuidv7().replace(/-/g, "");
    const price = Math.random() * 100; // Generate random price
    const userId = Math.floor(Math.random() * 100) + 1; // Assuming 100 users
    try {
      startTime = performance.now();
      await connection.query(insertQuery, [id, price, userId]);
    } catch (e) {
      try {
        await connection.rollback(); // Rollback in case of errors
        collesionCount++;
        console.log("rollingback", e);
      } catch (rollbackErr) {
        console.error("Error rolling back transaction:", rollbackErr);
      }
    } finally {
      endTime = performance.now();
      insertionTime = endTime - startTime;
      periodInsertionMiliSecondsSum += insertionTime;
      totalMilliSeconds += insertionTime;
      totalRecords++;
      if (i > 0 && i % 10000 == 0) {
        console.log(
          `UUIDV7: Inserted 10000 records in ${periodInsertionMiliSecondsSum}ms  ${i}/${count}`
        );
        periodInsertionMiliSecondsSum = 0;
      }
    }
  }
  console.log("All records inserted successfully!");
}

function getTotalInsertionTime() {
  return totalMilliSeconds;
}

function getCollesionCount() {
  return collesionCount;
}

module.exports = {
  insertRecords,
  getTotalInsertionTime,
  getCollesionCount,
};
