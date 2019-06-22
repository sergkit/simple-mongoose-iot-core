/*
Простой датчик с отправкой данных в Google Cloud
 */

load('api_config.js');
load('api_timer.js');
load('api_sys.js');
load('api_i2c.js');
load('api_mqtt.js');
load('api_adc.js');

let bus = I2C.get();
let lightAdr = 0x4A; //I2C адрес датчика освещенности 
let port=35; 
let topic = '/devices/' + Cfg.get('device.id') + '/'; //добавить events | config | state для получения реального адреса

let Sensors = {
	lightLevel: 0,
	dist:0,
	report: function () {
		return {
			dst: this.dist,
			l: this.lightLevel
		};
	},
	// Инициализация датчиков
	init: function () {
		ADC.enable(port);
		let result = I2C.writeRegB(bus, lightAdr, 0x02, 0x40); // ручной режим работы, по запросу
		return;
	},
	// проведение измерения
	measure: function () {
		let tempDist = 0;
		for (let j = 0; j < 5; j++) {
			tempDist += ADC.read(port);
			Sys.usleep(17000); //Задержка между измерениями в датчике расстояния
		}
		this.dist = tempDist / 5;
		// Измерение освещенности
		let val = I2C.readRegB(bus, lightAdr, 0x03);
		let val1 = I2C.readRegB(bus, lightAdr, 0x04);
		let exponent = (val & 0xF0) >> 4;
		let mantissa = ((val & 0x0F) << 4) | (val1 & 0x0F);
		this.lightLevel = Math.pow(2, exponent) * mantissa * 0.045;
		return;
	}
};
// инициализация датчиков
Sensors.init();
// функция для отправки объекта в облако
let MQTTSend = function (suff, obj) {
	let msg = JSON.stringify(obj);
	if (MQTT.isConnected()) {
		let ok = MQTT.pub(topic + suff, msg, 1);
		print(ok, suff, msg);
	} else {
		print(suff + "= Not connected! ", msg);
	}
};

//Таймер для запуска измерений и публикации в теме /devices/{device-id}/events
Timer.set(2000, Timer.REPEAT, function () {
	Sensors.measure();
	MQTTSend("events", Sensors.report());
}, null); 
