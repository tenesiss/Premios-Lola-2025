const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Deliberately read only the local file: this script must never seed a remote DB.
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env.local')));
const url = new URL(env.SQL_URL);
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/premios_lola_local') {
  throw new Error('Seeding is restricted to the local premios_lola_local database.');
}

const proposals = [
  [1, 'Un lugar para crecer', 'un-lugar-para-crecer.png'],
  [1, 'Ricitos de oro: una nueva aventura', 'ricitos-de-oro-una-nueva-aventura.png'],
  [1, 'Por qué los elefantes prefieren jugar', 'por-que-los-elefantes-prefieren-jugar.png'],
  [1, 'Nuestra silla de imaginar', 'nuestra-silla-de-imaginar.png'],
  [2, 'Las Caperucitas', 'las-caperucitas.png'],
  [2, 'La leyenda del Coquena', 'la-leyenda-del-coquena.png'],
  [2, 'La bella y la bestia', 'la-bella-y-la-bestia.png'],
  [3, 'Érase una vez', 'erase-una-vez.png'],
  [3, 'Encuentros', 'encuentros.png'],
  [4, 'El señor G', 'el-señor-g.png'],
  [4, 'El lobo no tan feroz', 'el-lobo-no-tan-feroz.png'],
  [5, 'El castillo de la bruja desordenada', 'el-castillo-de-la-bruja-desordenada.png'],
  [5, 'Dónde está mi voz', 'donde-esta-mi-voz.png'],
];

(async () => {
  const db = await mysql.createConnection(env.SQL_URL);
  try {
    const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM votos');
    if (count) {
      console.log('Local proposals already exist; keeping proposals, votes and group settings.');
      return;
    }
    await db.beginTransaction();
    for (const [group, name, logo] of proposals) {
      await db.execute('INSERT INTO votos (school, name, logo, `group`) VALUES (?, ?, ?, ?)',
        [`Escuela de prueba ${group}`, name, `static/images/${logo}`, group]);
    }
    await db.query('UPDATE state SET enabled = TRUE');
    await db.commit();
    console.log(`Seeded ${proposals.length} sample proposals; all five local groups are open for voting.`);
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    await db.end();
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
