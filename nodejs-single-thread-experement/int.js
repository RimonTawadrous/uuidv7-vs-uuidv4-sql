const mysql = require("mysql2/promise");

const insertQuery = `INSERT INTO chat_messages (chat_id, sender_id, message) VALUES (?, ?, ?)`;

async function insertRecords(connection, count) {
  let totalMilliSeconds = 0.0;
  let collesionCount = 0;
  let totalRecords = 0;
  let periodInsertionMiliSecondsSum = 0;
  let insertionTime;
  let startTime;
  let endTime;

  for (let i = 0; i <= count; i++) {
    const chat_id = Math.floor(Math.random() * 100) + 1; // Assuming 100 users
    const sender_id = Math.floor(Math.random() * 100) + 1; // Assuming 100 users
    const message = "Hello World";

    try {
      startTime = performance.now();
      await connection.query(insertQuery, [chat_id, sender_id, message]);
    } catch (e) {
      try {
        await connection.rollback(); // Rollback in case of errors
        console.error("Error inserting record:", e);
        collesionCount++;
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
          `Int Id: Inserted 10000 records in ${periodInsertionMiliSecondsSum}ms  ${i}/${count}`
        );
        periodInsertionMiliSecondsSum = 0;
      }
    }
  }
  console.log("All records inserted successfully!");
  return { totalMilliSeconds, collesionCount };
}

module.exports = {
  insertRecords,
};
