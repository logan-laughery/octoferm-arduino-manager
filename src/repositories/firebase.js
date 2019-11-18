import admin from 'firebase-admin';

let database;
let app;

async function getServiceAccount() {
  return await import('@root/octoferm-firebase-adminsdk.json');
}

export async function setupConnection() {
  const serviceAccount = await getServiceAccount();

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://octoferm.firebaseio.com"
  });

  database = app.database();
}

export function getConnection() {
  if (!database) {
    throw new Error('Firebase connection not initialized');
  }

  return database;
}

export function close() {
  database.ref().off();
  database.goOffline();
  app.delete();
}
