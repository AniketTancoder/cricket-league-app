const mysql = require("mysql2/promise");
(async () => {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Aniket@1928",
    database: "cricket_db",
  });
  await conn.execute("ALTER TABLE `Match` ADD COLUMN battingFirst INT");
  console.log("Column added successfully");
  conn.end();
})();
