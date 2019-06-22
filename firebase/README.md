Подключение  к Firebase IoT  устройства через GCP-Cloud IoT Core (https://cloud.google.com/iot-core/).

Устройства публикуют сообщения телеметрии по протоколу  MQTT  в Cloud Iot Core.

Устройство представляет собой отладочную плату на основе ESP32 - Wifi-чип, с подключенными датчиками освещенности и расстояния. ESP32 работает под управлением Mongoose OS (https://mongoose-os.com/).

Папка  functions содержит облачные функции firebase, в папке public лежат файлы для веб интерфейса 