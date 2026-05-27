const webPush = require('web-push');
const pool = require('../config/db');

const PUBLIC_KEY = process.env.WEB_PUSH_PUBLIC_KEY || process.env.FIREBASE_SERVER_KEY || '';
const PRIVATE_KEY = process.env.WEB_PUSH_PRIVATE_KEY || process.env.FIREBASE_WEB_PUSH_KEY || '';
const SUBJECT = process.env.WEB_PUSH_SUBJECT || 'mailto:support@agroplatform.local';

const isPushConfigured = () => Boolean(PUBLIC_KEY && PRIVATE_KEY);

if (isPushConfigured()) {
  webPush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

const ensureSubscriptionTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      endpoint VARCHAR(500) NOT NULL UNIQUE,
      p256dh VARCHAR(255) NOT NULL,
      auth VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const saveSubscription = async (userId, subscription) => {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Abonnement push invalide.');
  }

  await ensureSubscriptionTable();
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       p256dh = VALUES(p256dh),
       auth = VALUES(auth),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
  );
};

const removeSubscription = async (endpoint) => {
  await ensureSubscriptionTable();
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
};

const loadSubscriptionsByUserIds = async (userIds = []) => {
  if (!userIds.length) {
    return [];
  }

  await ensureSubscriptionTable();
  const [rows] = await pool.query(
    `SELECT * FROM push_subscriptions WHERE user_id IN (${userIds.map(() => '?').join(',')})`,
    userIds
  );

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth
    }
  }));
};

const notifyUsers = async (userIds, payload) => {
  if (!isPushConfigured()) {
    return { sent: 0, skipped: true };
  }

  const subscriptions = await loadSubscriptionsByUserIds(
    [...new Set((userIds || []).filter(Boolean).map((item) => Number(item)))]
  );

  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(subscription, JSON.stringify(payload));
      sent += 1;
    } catch (error) {
      if ([404, 410].includes(error.statusCode)) {
        await removeSubscription(subscription.endpoint);
      }
    }
  }

  return { sent, skipped: false };
};

module.exports = {
  ensureSubscriptionTable,
  isPushConfigured,
  notifyUsers,
  PUBLIC_KEY,
  removeSubscription,
  saveSubscription
};
