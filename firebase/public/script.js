// Firebase initialization is already done as we use "simpler project configuration".
// Конфигирирование Firebase смотри https://firebase.google.com/docs/web/setup?authuser=0#host_your_web_app_using_firebase_hosting
// написано на ocнове https://github.com/olivierlourme/iot-store-display
// Количество отсчетов для отображения:
const nbOfElts = 750;

// Список устройств
let devicesIds = [];
// Массив названий датчиков 
let devicesAliases = [];


// получение элементов DOM для рисования графиков
const lightPlotDiv = document.getElementById('LightPlot');
const distancePlotDiv = document.getElementById('DistancePlot');

// подключение Firebase Realime Database:
const db = firebase.database();

// Переменные для хранения времени, расстояния и освещенности
let timestamps;
let distances;
let lightes;

// Настройки plotly.js 
const commonLayout = {
    titlefont: {
        family: 'Courier New, monospace',
        size: 16,
        color: '#000'
    },
    xaxis: {
        linecolor: 'black',
        linewidth: 2
    },
    yaxis: {
        titlefont: {
            family: 'Courier New, monospace',
            size: 14,
            color: '#000'
        },
        linecolor: 'black',
        linewidth: 2,
    },
    margin: {
        r: 50,
        pad: 0
    }
};

let distanceLayout = JSON.parse(JSON.stringify(commonLayout));
distanceLayout.title = '<b>Дистанция до объекта</b>';
distanceLayout.yaxis.title = '<b>Дистанция, 1/х </b>';

let lightLayout = JSON.parse(JSON.stringify(commonLayout));
lightLayout.title = '<b>Уровень освещенности</b>';
lightLayout.yaxis.title = '<b>Освещенность (Люкс)</b>';

// Однократное получение списка устройств
db.ref('devices-ids').once('value', (snapshot) => {
    snapshot.forEach(childSnapshot => {
        const childKey = childSnapshot.key;
        devicesIds.push(childKey);
        const childData = childSnapshot.val();
        let deviceAlias;
        if(childData == true) {
            deviceAlias = childKey; 
        } else {
            deviceAlias = childData; 
        }
        devicesAliases.push(deviceAlias);
    });

    if (devicesIds.length != 0) {
        // готовим массив для хранения данных
        timestamps = { [devicesIds[0]]: [] };
        distances = { [devicesIds[0]]: [] };
        lightes = { [devicesIds[0]]: [] };
        for (let i = 1; i < devicesIds.length; i++) {
            timestamps[devicesIds[i]] = [];
            distances[devicesIds[i]] = [];
            lightes[devicesIds[i]] = [];
        }
    } else console.log('No device id was found.')
})
.then(() => { 
    for (let i = 0; i < devicesIds.length; i++) {
        // подписка на данные всех заданных устройств
        db.ref(`devices-telemetry-simple/${devicesIds[i]}`).limitToLast(nbOfElts).on('value', ts_measures => {
            //console.log(ts_measures.val());
            timestamps[devicesIds[i]] = [];
            distances[devicesIds[i]] = [];
            lightes[devicesIds[i]] = [];

            ts_measures.forEach(ts_measure => {
                timestamps[devicesIds[i]].push(moment(ts_measure.val().t).format('YYYY-MM-DD HH:mm:ss'));
                distances[devicesIds[i]].push(ts_measure.val().d);
                lightes[devicesIds[i]].push(ts_measure.val().l);
            });

            // Строим графики расстояния от времени для всех датчиков
            let distanceTraces = [];  
            for (let i = 0; i < devicesIds.length; i++) {
                distanceTraces[i] = {
                    x: timestamps[devicesIds[i]],
                    y: distances[devicesIds[i]],
                    name: devicesAliases[i]
                }
            }
            let distanceData = []; 
            for (let i = 0; i < devicesIds.length; i++) {
                distanceData.push(distanceTraces[i]);
            }
            Plotly.newPlot(distancePlotDiv, distanceData, distanceLayout, { responsive: true });

            // И для освещенности
            let lightTraces = [];  
            for (let i = 0; i < devicesIds.length; i++) {
                lightTraces[i] = {
                    x: timestamps[devicesIds[i]],
                    y: lightes[devicesIds[i]],
                    name: devicesAliases[i]
                }
            }
            let lightData = []; 
            for (let i = 0; i < devicesIds.length; i++) {
                lightData.push(lightTraces[i]);
            }
            Plotly.newPlot(lightPlotDiv, lightData, lightLayout, { responsive: true });
        });
    }
})
.catch(err => {
    console.err('An error occured:', err);
});
