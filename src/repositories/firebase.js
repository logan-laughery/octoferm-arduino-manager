import admin from 'firebase-admin';

let database;

async function getServiceAccount() {
  return await import('@root/octoferm-firebase-adminsdk.json');
}

export async function setupConnection() {
  const serviceAccount = await getServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://octoferm.firebaseio.com"
  });

  database = admin.database();
}

export function getConnection() {
  if (!database) {
    throw new Error('Firebase connection not initialized');
  }

  return database;
}
