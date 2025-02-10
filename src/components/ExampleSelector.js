import React, { useState } from 'react';


const EXAMPLES = {
  basics: {
    category: "Basic Examples",
    items: {
      blink: {
        name: "LED Blink",
        description: "Basic LED blinking example",
        difficulty: "Beginner",
        code: (pin = 2) => `
// Basic LED Blink Example
// LED connected to GPIO ${pin}

#define LED_PIN ${pin}

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  delay(1000);
}`
      },
      fade: {
        name: "LED Fade",
        description: "PWM LED fading example",
        difficulty: "Beginner",
        code: (pin = 2) => `
// LED Fade Example using PWM
// LED connected to GPIO ${pin}

#define LED_PIN ${pin}
#define LED_CHANNEL 0
#define FADE_STEP 5

void setup() {
  ledcSetup(LED_CHANNEL, 5000, 8);  // 5KHz, 8-bit resolution
  ledcAttachPin(LED_PIN, LED_CHANNEL);
}

void loop() {
  // Fade in
  for(int brightness = 0; brightness <= 255; brightness += FADE_STEP) {
    ledcWrite(LED_CHANNEL, brightness);
    delay(30);
  }
  
  // Fade out
  for(int brightness = 255; brightness >= 0; brightness -= FADE_STEP) {
    ledcWrite(LED_CHANNEL, brightness);
    delay(30);
  }
}`
      },
      button: {
        name: "Button Input",
        description: "Read button state and control LED",
        difficulty: "Beginner",
        code: (buttonPin = 4, ledPin = 2) => `
// Button Input Example
// Button connected to GPIO ${buttonPin}
// LED connected to GPIO ${ledPin}

#define BUTTON_PIN ${buttonPin}
#define LED_PIN ${ledPin}

bool lastButtonState = HIGH;
bool ledState = LOW;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, ledState);
}

void loop() {
  bool buttonState = digitalRead(BUTTON_PIN);
  
  if (buttonState != lastButtonState && buttonState == LOW) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    delay(50);  // Debounce delay
  }
  
  lastButtonState = buttonState;
}`
      }
    }
  },
  sensors: {
    category: "Sensor Projects",
    items: {
      dht11: {
        name: "DHT11 Temperature & Humidity",
        description: "Read temperature and humidity from DHT11 sensor",
        difficulty: "Intermediate",
        code: (dhtPin = 4) => `
// DHT11 Temperature & Humidity Sensor Example
// DHT11 connected to GPIO ${dhtPin}

#include <DHTesp.h>

#define DHT_PIN ${dhtPin}
DHTesp dht;

void setup() {
  Serial.begin(115200);
  dht.setup(DHT_PIN, DHTesp::DHT11);
}

void loop() {
  float humidity = dht.getHumidity();
  float temperature = dht.getTemperature();

  if (!isnan(humidity) && !isnan(temperature)) {
    Serial.printf("Temperature: %.1f°C, Humidity: %.1f%%\\n", 
                  temperature, humidity);
  }

  delay(2000);  // DHT11 sampling rate is 1Hz
}`
      },
      ldr: {
        name: "Light Sensor (LDR)",
        description: "Read light levels and control LED",
        difficulty: "Beginner",
        code: (ldrPin = 36, ledPin = 2) => `
// Light Sensor Example with LDR
// LDR connected to GPIO ${ldrPin}
// LED connected to GPIO ${ledPin}

#define LDR_PIN ${ldrPin}
#define LED_PIN ${ledPin}
#define LIGHT_THRESHOLD 2000

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int lightLevel = analogRead(LDR_PIN);
  Serial.printf("Light level: %d\\n", lightLevel);
  
  if (lightLevel < LIGHT_THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);  // Turn on LED in dark
  } else {
    digitalWrite(LED_PIN, LOW);   // Turn off LED in light
  }
  
  delay(100);
}`
      }
    }
  },
  displays: {
    category: "Display Projects",
    items: {
      oled: {
        name: "OLED Display",
        description: "Display text and graphics on OLED",
        difficulty: "Intermediate",
        code: () => `
// OLED Display Example using SSD1306
// Connect: SCL -> GPIO 22, SDA -> GPIO 21

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  Wire.begin();
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
    for(;;);
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
}

void loop() {
  display.clearDisplay();
  
  // Draw text
  display.setCursor(0,0);
  display.println("Hello, World!");
  
  // Draw a rectangle
  display.drawRect(0, 20, 60, 20, SSD1306_WHITE);
  
  // Draw a filled circle
  display.fillCircle(100, 30, 10, SSD1306_WHITE);
  
  display.display();
  delay(2000);
}`
      }
    }
  },
  advanced: {
    category: "Advanced Projects",
    items: {
      rgbControl: {
        name: "RGB LED Control",
        description: "Control RGB LED with smooth transitions",
        difficulty: "Intermediate",
        code: (redPin = 25, greenPin = 26, bluePin = 27) => `
// RGB LED Control Example
// Red -> GPIO ${redPin}
// Green -> GPIO ${greenPin}
// Blue -> GPIO ${bluePin}

#define RED_PIN ${redPin}
#define GREEN_PIN ${greenPin}
#define BLUE_PIN ${bluePin}

#define RED_CHANNEL 0
#define GREEN_CHANNEL 1
#define BLUE_CHANNEL 2

void setup() {
  // Configure LED PWM channels
  ledcSetup(RED_CHANNEL, 5000, 8);
  ledcSetup(GREEN_CHANNEL, 5000, 8);
  ledcSetup(BLUE_CHANNEL, 5000, 8);
  
  // Attach the channels to GPIOs
  ledcAttachPin(RED_PIN, RED_CHANNEL);
  ledcAttachPin(GREEN_PIN, GREEN_CHANNEL);
  ledcAttachPin(BLUE_PIN, BLUE_CHANNEL);
}

void setColor(int red, int green, int blue) {
  ledcWrite(RED_CHANNEL, red);
  ledcWrite(GREEN_CHANNEL, green);
  ledcWrite(BLUE_CHANNEL, blue);
}

void loop() {
  // Red to Green
  for(int i = 0; i <= 255; i++) {
    setColor(255 - i, i, 0);
    delay(10);
  }
  
  // Green to Blue
  for(int i = 0; i <= 255; i++) {
    setColor(0, 255 - i, i);
    delay(10);
  }
  
  // Blue to Red
  for(int i = 0; i <= 255; i++) {
    setColor(i, 0, 255 - i);
    delay(10);
  }
}`
      },
      webServer: {
        name: "Web Server LED Control",
        description: "Control LED through web interface",
        difficulty: "Advanced",
        code: (ledPin = 2) => `
// Web Server LED Control Example
// LED connected to GPIO ${ledPin}

#include <WiFi.h>
#include <WebServer.h>

#define LED_PIN ${ledPin}

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);

// HTML Page
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <title>ESP32 LED Control</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: Arial; 
      text-align: center; 
      margin-top: 50px; 
    }
    .button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 16px 40px;
      text-decoration: none;
      font-size: 30px;
      margin: 2px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>ESP32 LED Control</h1>
  <p><a href="/led/on"><button class="button">ON</button></a></p>
  <p><a href="/led/off"><button class="button">OFF</button></a></p>
</body>
</html>
)rawliteral";

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());
  
  // Setup web server routes
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", index_html);
  });
  
  server.on("/led/on", HTTP_GET, []() {
    digitalWrite(LED_PIN, HIGH);
    server.sendHeader("Location", "/");
    server.send(303);
  });
  
  server.on("/led/off", HTTP_GET, []() {
    digitalWrite(LED_PIN, LOW);
    server.sendHeader("Location", "/");
    server.send(303);
  });
  
  server.begin();
}

void loop() {
  server.handleClient();
}`
      }
    }
  }
};

function ExampleGallery({ onSelectExample }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExamples = searchTerm
    ? Object.entries(EXAMPLES).reduce((acc, [category, { items, category: categoryName }]) => {
        const filteredItems = Object.entries(items).filter(([_, item]) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredItems.length > 0) {
          acc[category] = {
            category: categoryName,
            items: Object.fromEntries(filteredItems)
          };
        }
        return acc;
      }, {})
    : EXAMPLES;

  return (
    <div className="example-gallery">
      <div className="gallery-header">
        <h2>Example Projects</h2>
        <input
          type="text"
          placeholder="Search examples..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="category-tabs">
        <button
          className={`category-tab ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {Object.entries(EXAMPLES).map(([key, { category }]) => (
          <button
            key={key}
            className={`category-tab ${selectedCategory === key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(key)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="examples-grid">
        {Object.entries(filteredExamples)
          .filter(([key]) => !selectedCategory || key === selectedCategory)
          .map(([_, { category, items }]) => (
            <div key={category} className="category-section">
              <h3>{category}</h3>
              <div className="examples-row">
                {Object.entries(items).map(([key, example]) => (
                  <div
                    key={key}
                    className="example-card"
                    onClick={() => onSelectExample(key, example)}
                  >
                    <h4>{example.name}</h4>
                    <p className="description">{example.description}</p>
                    <span className={`difficulty ${example.difficulty.toLowerCase()}`}>
                      {example.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export { EXAMPLES, ExampleGallery };