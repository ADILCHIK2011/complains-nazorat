const { MongoClient } = require('mongodb');
const config = require('../config');

let client;
let db;

async function connect() {
  if (db) return db;
  client = new MongoClient(config.mongodbUri);
  await client.connect();
  db = client.db(config.mongodbDb);

  await db.collection('users').createIndex({ chatId: 1 }, { unique: true });
  await db.collection('complaints').createIndex({ chatId: 1 });
  await db.collection('complaints').createIndex({ status: 1 });
  await db.collection('complaints').createIndex({ ceoOriginalMsgId: 1 });
  await db.collection('complaints').createIndex({ createdAt: 1 });

  console.log(`[mongo] connected to database "${config.mongodbDb}"`);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Mongo not connected yet — call connect() first');
  }
  return db;
}

async function disconnect() {
  if (client) await client.close();
}

module.exports = { connect, getDb, disconnect };
