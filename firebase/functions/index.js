// Подключение функционала облачных функций
const functions = require('firebase-functions');

// доступ к Firebase Realtime Database:
const admin = require('firebase-admin');

const cors = require('cors')({origin: true});
//Инициализация БД
admin.initializeApp();
const db = admin.database();


// Подписка на телеметрию:
exports.detectTelemetryEvents = functions.pubsub.topic('main-telemetry-topic').onPublish(
        (message, context) => {
    const l = message.json.l.toFixed(1);
    const dst = message.json.dst.toFixed(1);
    const deviceId = message.attributes.deviceId; 
    const timestamp = context.timestamp;
    // Отправка лога в журнал:
    console.log(`Device=${deviceId}, light=${l}lux, distance=${dst}, Timestamp=${timestamp}`);
    const data = {
        t: timestamp,
        l: l,
        d: dst
    };
    // Отправка в Firebase Realtime Database 
    return  db.ref(`devices-telemetry-simple/${deviceId}`).push(data);
});
