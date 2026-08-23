/*
  Kshiralaya ESP32 Controller
  ---------------------------
  Connects the ESP32 to Wi-Fi and hosts a small HTTP server so the
  Kshiralaya admin dashboard (public/admin.html) can:
    - check whether the device is reachable  -> GET /status
    - blink the built-in LED                 -> GET /blink

  Board: any ESP32 dev board (tested against the generic "ESP32 Dev Module").
  Library required: WiFi.h and WebServer.h (both ship with the
  "esp32" board package by Espressif in the Arduino IDE Boards Manager).

  Setup:
    1. Install the ESP32 board package in Arduino IDE
       (File > Preferences > Additional Board URLs, then Boards Manager).
    2. Select your ESP32 board + correct COM port.
    3. Fill in WIFI_SSID / WIFI_PASSWORD below.
    4. Upload. Open Serial Monitor at 115200 baud to read the assigned IP.
    5. Enter that IP into the "ESP32 Connection" card in the admin dashboard.

  Note: the admin dashboard talks to the ESP32 directly from the browser
  over plain HTTP. If the dashboard itself is served over HTTPS, browsers
  will block "mixed content" requests to a plain-HTTP device - open the
  dashboard over HTTP (e.g. on your local network) when using this feature.
*/

#include <WiFi.h>
#include <WebServer.h>

// ---- Wi-Fi credentials ----
const char* WIFI_SSID     = "Ramleela";
const char* WIFI_PASSWORD = "llnkvv39495";

// ---- Device settings ----
const char* DEVICE_NAME = "Kshiralaya-ESP32";
const int   LED_PIN     = LED_BUILTIN; // most ESP32 dev boards: GPIO2

WebServer server(80);

bool ledBusy = false;

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

void sendCorsHeaders(){
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void sendJson(int code, const String& json){
    sendCorsHeaders();
    server.send(code, "application/json", json);
}

// ---------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------

void handleOptions(){
    sendCorsHeaders();
    server.send(204);
}

void handleStatus(){
    String json = "{";
    json += "\"success\":true,";
    json += "\"connected\":true,";
    json += "\"deviceName\":\"" + String(DEVICE_NAME) + "\",";
    json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
    json += "\"uptimeMs\":" + String(millis());
    json += "}";

    sendJson(200, json);
}

void handleBlink(){
    if(ledBusy){
        sendJson(200, "{\"success\":false,\"message\":\"LED is already blinking, try again shortly\"}");
        return;
    }

    ledBusy = true;

    for(int i = 0; i < 3; i++){
        digitalWrite(LED_PIN, HIGH);
        delay(200);
        digitalWrite(LED_PIN, LOW);
        delay(200);
    }

    ledBusy = false;

    sendJson(200, "{\"success\":true,\"message\":\"LED blinked successfully\"}");
}

void handleNotFound(){
    sendJson(404, "{\"success\":false,\"message\":\"Not found\"}");
}

// ---------------------------------------------------------------------
// Setup / loop
// ---------------------------------------------------------------------

void setup(){
    Serial.begin(115200);

    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    Serial.print("Connecting to Wi-Fi");
    while(WiFi.status() != WL_CONNECTED){
        delay(400);
        Serial.print(".");
    }
    Serial.println();

    Serial.print("Connected! IP address: ");
    Serial.println(WiFi.localIP());

    server.on("/status", HTTP_GET, handleStatus);
    server.on("/status", HTTP_OPTIONS, handleOptions);

    server.on("/blink", HTTP_GET, handleBlink);
    server.on("/blink", HTTP_OPTIONS, handleOptions);

    server.onNotFound(handleNotFound);

    server.begin();
    Serial.println("HTTP server started on port 80");
}

void loop(){
    server.handleClient();
}
