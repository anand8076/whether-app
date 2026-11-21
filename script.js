
// =====================================
// WEATHERLY - LIVE WEATHER DASHBOARD
// Powered by Open-Meteo API
// =====================================

// HTML Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const weatherIcon = document.getElementById("weatherIcon");
const heroIcon = document.getElementById("heroIcon");

const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feelsLike = document.getElementById("feelsLike");
const heroFeels = document.getElementById("heroFeels");
const visibility = document.getElementById("visibility");

const forecastContainer = document.getElementById("forecast");

// =====================================
// WEATHER CODE MAPPING
// =====================================

function getWeatherInfo(code) {

    const weatherConditions = {
        0: ["Clear Sky", "☀️"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Depositing Rime Fog", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Moderate Drizzle", "🌦️"],
        55: ["Dense Drizzle", "🌧️"],
        56: ["Freezing Drizzle", "🌧️"],
        57: ["Dense Freezing Drizzle", "🌧️"],
        61: ["Light Rain", "🌧️"],
        63: ["Moderate Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        66: ["Freezing Rain", "🌧️"],
        67: ["Heavy Freezing Rain", "🌧️"],
        71: ["Light Snow", "🌨️"],
        73: ["Moderate Snow", "❄️"],
        75: ["Heavy Snow", "❄️"],
        77: ["Snow Grains", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Moderate Showers", "🌧️"],
        82: ["Heavy Showers", "⛈️"],
        85: ["Snow Showers", "🌨️"],
        86: ["Heavy Snow Showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm", "⛈️"]
    };

    return weatherConditions[code] || ["Unknown Weather", "🌤️"];
}

// =====================================
// SHOW MESSAGE
// =====================================

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `message ${type}`;
}

// =====================================
// STEP 1: SEARCH CITY
// =====================================

async function searchWeather(city = cityInput.value.trim()) {

    city = city.trim();

    // Input Validation
    if (!city) {
        showMessage("Please enter a city name!", "error");
        cityInput.focus();
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";

    showMessage("Fetching live weather data...");

    try {

        // =====================================
        // STEP 2: GEOCODING API
        // =====================================

        const geoURL = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoURL.search = new URLSearchParams({
            name: city,
            count: 1,
            language: "en",
            format: "json"
        });

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Unable to search city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found! Please try another city.");
        }

        const location = geoData.results[0];

        const latitude = location.latitude;
        const longitude = location.longitude;

        // =====================================
        // STEP 3: WEATHER FORECAST API
        // =====================================

        const weatherURL = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        weatherURL.search = new URLSearchParams({
            latitude: latitude,
            longitude: longitude,

            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "weather_code",
                "wind_speed_10m"
            ].join(","),

            hourly: "visibility",

            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min"
            ].join(","),

            timezone: "auto",
            forecast_days: 5
        });

        const weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch weather data.");
        }

        const weatherData = await weatherResponse.json();

        // =====================================
        // STEP 4: DISPLAY CURRENT WEATHER
        // =====================================

        const current = weatherData.current;

        const info = getWeatherInfo(current.weather_code);

        const place = [
            location.name,
            location.admin1,
            location.country
        ].filter(Boolean).filter((value, index, array) =>
            array.indexOf(value) === index
        );

        cityName.textContent = place.join(", ");

        const date = new Date(
            current.time.replace(" ", "T")
        );

        document.getElementById("currentDate").textContent =
            date.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });

        temperature.textContent =
            `${Math.round(current.temperature_2m)}°`;

        description.textContent = info[0];

        weatherIcon.textContent = info[1];
        heroIcon.textContent = info[1];

        // Humidity
        humidity.textContent =
            `${current.relative_humidity_2m}%`;

        // Wind Speed
        wind.textContent =
            `${current.wind_speed_10m} km/h`;

        // Feels Like
        const feels = `${Math.round(current.apparent_temperature)}°`;

        feelsLike.textContent = feels;
        heroFeels.textContent = feels;

        // =====================================
        // STEP 5: CURRENT VISIBILITY
        // =====================================

        const hourly = weatherData.hourly;

        const currentTime = new Date(
            current.time.replace(" ", "T")
        ).getTime();

        let nearestIndex = 0;
        let smallestDifference = Infinity;

        hourly.time.forEach((time, index) => {

            const hourTime = new Date(
                time.replace(" ", "T")
            ).getTime();

            const difference = Math.abs(
                hourTime - currentTime
            );

            if (difference < smallestDifference) {
                smallestDifference = difference;
                nearestIndex = index;
            }

        });

        const visibilityValue =
            hourly.visibility[nearestIndex];

        visibility.textContent =
            `${(visibilityValue / 1000).toFixed(1)} km`;

        // =====================================
        // STEP 6: GENERATE 5-DAY FORECAST
        // =====================================

        forecastContainer.innerHTML = "";

        const daily = weatherData.daily;

        daily.time.forEach((day, index) => {

            const dayInfo = getWeatherInfo(
                daily.weather_code[index]
            );

            const date = new Date(day + "T12:00:00");

            const dayName = date.toLocaleDateString(
                "en-IN",
                { weekday: "short" }
            );

            // Create forecast card
            const card = document.createElement("div");

            card.className = "day-card";

            const dayTitle = document.createElement("p");
            dayTitle.className = "day-name";
            dayTitle.textContent = dayName;

            const icon = document.createElement("div");
            icon.className = "day-icon";
            icon.textContent = dayInfo[1];

            const condition = document.createElement("p");
            condition.className = "day-condition";
            condition.textContent = dayInfo[0];

            const highTemp = document.createElement("h3");
            highTemp.className = "day-temp";
            highTemp.textContent =
                `${Math.round(daily.temperature_2m_max[index])}°`;

            const lowTemp = document.createElement("p");
            lowTemp.className = "day-low";
            lowTemp.textContent =
                `${Math.round(daily.temperature_2m_min[index])}°`;

            card.append(
                dayTitle,
                icon,
                condition,
                highTemp,
                lowTemp
            );

            forecastContainer.appendChild(card);

        });

        showMessage(
            "Weather updated successfully!",
            "success"
        );

        cityInput.value = "";

    } catch (error) {

        console.error("Weather API Error:", error);

        showMessage(error.message, "error");

    } finally {

        searchBtn.disabled = false;
        searchBtn.textContent = "Search";

    }
}

// =====================================
// STEP 7: BUTTON CLICK EVENT
// =====================================

searchBtn.addEventListener("click", () => {
    searchWeather();
});

// =====================================
// STEP 8: ENTER KEY EVENT
// =====================================

cityInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        searchWeather();
    }

});

// =====================================
// STEP 9: DEFAULT CITY WEATHER
// =====================================

// Website opens with Delhi weather
searchWeather("Delhi");