const { uuidv7 } = require("uuidv7");

const insertQuery = `INSERT INTO chat_messages (id, chat_id, sender_id, message) VALUES (UNHEX(?), UNHEX(?), UNHEX(?), ?)`;

let totalMilliSeconds = 0.0;
let collesionCount = 0;
async function insertRecords(connection, count) {
  let totalRecords = 0;
  let periodInsertionMiliSecondsSum = 0;
  let insertionTime;
  let startTime;
  let endTime;
  for (let i = 0; i <= count; i++) {
    let id = uuidv7().replace(/-/g, "");
    let chat_id = uuidv7().replace(/-/g, "");
    let sender_id = uuidv7().replace(/-/g, "");
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
          `UUIDV7: Inserted 10000 records in ${periodInsertionMiliSecondsSum}ms  ${i}/${count}`
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
