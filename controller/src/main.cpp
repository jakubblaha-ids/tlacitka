#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>

#define BUTTON_PIN 14
#define MIN_BUTTON_PRESS_INTERVAL 3000

void handlePressButton();
void connectWs();

// const char* ssid = "HelloWorld";
// const char* password = "KopiStack";

const char* ssid = "kpopelnici.cz";
const char* password = "95237664";

const char* serverHostname = "mac.local";

WebSocketsClient webSocket;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 1000;  // 10 seconds

unsigned long int lastSentTime = 0;

void setup() {
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    Serial.begin(115200);
    delay(10);

    // Connect to WiFi
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    connectWs();
}

void sendEvent(String event) {
    if (webSocket.isConnected()) {
        String message = "{\"source\": \"button\", \"event\": \"" + event + "\"";
        message += ", \"ip\": \"" + WiFi.localIP().toString() + "\"}";

        webSocket.sendTXT(message.c_str());
        Serial.println("Sent event: " + event);
    }
}

void loop() {
    webSocket.loop();
    handlePressButton();

    // Check if it's time to send heartbeat
    unsigned long currentMillis = millis();
    if (currentMillis - lastHeartbeat >= heartbeatInterval) {
        sendEvent("heartbeat");
        lastHeartbeat = currentMillis;
    }
}

void handlePressButton() {
    bool currentButtonState = digitalRead(BUTTON_PIN);

    if (currentButtonState == LOW) {
        unsigned long int currentMillis = millis();

        if (currentMillis - lastSentTime < MIN_BUTTON_PRESS_INTERVAL) {
            return;
        }

        sendEvent("pressed");
        Serial.println("Button pressed, sent WebSocket message");

        lastSentTime = currentMillis;
    }
}

void connectWs() {
    Serial.print("Connecting to WebSocket at ");
    Serial.print(serverHostname);
    Serial.println(":8080");

    webSocket.begin(serverHostname, 8080, "/");

    webSocket.onEvent([](WStype_t type, uint8_t* payload, size_t length) {
        switch (type) {
            case WStype_DISCONNECTED:
                Serial.println("WebSocket disconnected");
                break;
            case WStype_CONNECTED:
                Serial.println("WebSocket connected");
                sendEvent("connected");
                break;
            case WStype_TEXT:
                Serial.printf("WebSocket message: %s\n", payload);
                break;
            case WStype_BIN:
                Serial.println("WebSocket binary message received");
                break;
        }
    });

    webSocket.setReconnectInterval(5000);
    webSocket.enableHeartbeat(15000, 3000, 2);
}