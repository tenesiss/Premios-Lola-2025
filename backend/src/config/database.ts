import './env';
import mysql from 'mysql2';
import type { RowDataPacket } from 'mysql2';

if (!process.env.SQL_URL) {
  throw new Error('SQL_URL is required. Configure backend/.env.local before starting the API.');
}

const db = mysql.createConnection(process.env.SQL_URL);
const AMOUNT_GROUPS = 4;

export async function initializeDatabase(): Promise<void> {
    const connection = db.promise();
    const setupQueries = [
      `CREATE TABLE IF NOT EXISTS \`votos\` (
        ID tinyint AUTO_INCREMENT PRIMARY KEY,
        school tinytext NOT NULL,
        name text NOT NULL,
        logo tinytext NOT NULL,
        votes smallint UNSIGNED NOT NULL DEFAULT 0,
        \`group\` smallint UNSIGNED NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS \`users\` (
        ID int AUTO_INCREMENT PRIMARY KEY,
        UID text NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE
      )`,
      `CREATE TABLE IF NOT EXISTS \`state\` (
        ID tinyint AUTO_INCREMENT PRIMARY KEY,
        \`group\` smallint UNSIGNED NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT FALSE
      )`
    ];
    for (const query of setupQueries) await connection.query(query);

    if (process.env.ADMIN_UID) {
      const [admins] = await connection.query<RowDataPacket[]>(
        'SELECT ID FROM users WHERE UID = ?', [process.env.ADMIN_UID],
      );
      if (!admins.length) {
        await connection.query('INSERT INTO users (UID, is_admin) VALUES (?, TRUE)', [process.env.ADMIN_UID]);
      }
    }

    for (let group = 1; group <= AMOUNT_GROUPS; group++) {
      await connection.query(
        'INSERT IGNORE INTO state (ID, enabled, `group`) VALUES (?, FALSE, ?)',
        [group, group],
      );
    }
    console.log('MySQL connected; database tables are ready.');
}

export default db;
