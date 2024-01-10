const crypto = require("crypto");

const insertQuery = `INSERT INTO chat_messages (id, chat_id, sender_id, message) VALUES (UNHEX(?), UNHEX(?), UNHEX(?), ?)`;

async function insertRecords(connection, count) {
  let totalMilliSeconds = 0.0;
  let collesionCount = 0;
  let totalRecords = 0;
  let periodInsertionMiliSecondsSum = 0;
  let insertionTime;
  let startTime;
  let endTime;

  for (let i = 0; i <= count; i++) {
    const id = crypto.randomUUID().replace(/-/g, "");
    const chat_id = crypto.randomUUID().replace(/-/g, "");
    const sender_id = crypto.randomUUID().replace(/-/g, "");
    const message = "Hello World";

    try {
      startTime = performance.now();
      await connection.query(insertQuery, [id, chat_id, sender_id, message]);
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
          `UUIDV4: Inserted 10000 records in ${periodInsertionMiliSecondsSum}ms  ${i}/${count}`
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
