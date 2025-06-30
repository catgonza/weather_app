/*
 * Gathers and displays the current weather plus a week-long forecast for a city entered by the user 
 * using the Open Meteor geocoding and forecast APIs.
 */

async function getWeather() {
    const cityInput = document.getElementById("cityInput").value.trim();
    const output = document.getElementById("weatherOutput");
    output.textContent = "";

    if (!cityInput) {
        output.textContent = "Please enter a city name.";
        return;
    }

    output.textContent = "Fetching weather data...";

    try {
        const city = cityInput.toLowerCase();
        const { latitude, longitude, name, country } = await fetchCoordinates(city);
        const weatherData = await fetchWeather(latitude, longitude);

        displayWeather(name, country, weatherData, output);

    } catch (error) {
        output.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
        console.error("Weather fetching failed:", error);
    }
}

async function fetchCoordinates(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;
    const response = await fetch(geoUrl);
    if (!response.ok) throw new Error("Geocoding API request failed.");

    const data = await response.json();
    if (!data.results || data.results.length === 0) throw new Error("City not found. Please try another one.");

    const { latitude, longitude, name, country } = data.results[0];
    return { latitude, longitude, name, country };
}

async function fetchWeather(latitude, longitude) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&hourly=relativehumidity_2m,precipitation&timezone=auto`;
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error("Weather API request failed.");
    return await response.json();
}

function displayWeather(name, country, weatherData, output) {
    const { current_weather: current, daily, hourly } = weatherData;
    const isFahrenheit = document.getElementById("tempToggle").checked;
    const tempUnit = isFahrenheit ? "F" : "C";
    const convert = (temp) => isFahrenheit ? (temp * 9 / 5) + 32 : temp;

    const nowHourIndex = new Date().getHours();
    const currentHumidity = hourly?.relativehumidity_2m?.[nowHourIndex] ?? "N/A";
    const currentPrecip = hourly?.precipitation?.[nowHourIndex] ?? "N/A";

    let html = `<strong>Current Weather for ${name}, ${country}</strong><br>
                Temperature: ${convert(current.temperature).toFixed(1)} °${tempUnit}<br>
                Wind Speed: ${current.windspeed} km/h<br>
                Humidity: ${currentHumidity}%<br>
                Precipitation: ${currentPrecip} mm<br><br>
                <strong>7-Day Forecast:</strong><br>`;

    const days = Math.min(7, daily.time.length);
    for (let i = 0; i < days; i++) {
        const icon = getIcon(daily.weathercode[i]);
        html += `${daily.time[i]}<br>
                 <img src="${icon}" alt="icon" width="32" />
                 Max: ${convert(daily.temperature_2m_max[i]).toFixed(1)} °${tempUnit}, 
                 Min: ${convert(daily.temperature_2m_min[i]).toFixed(1)} °${tempUnit}, 
                 Precip: ${daily.precipitation_sum?.[i] ?? "N/A"} mm<br><br>`;
    }

    output.innerHTML = html;
}


/*
 * icons
 */
function getIcon(code) {
    if ([0].includes(code)) return "https://img.icons8.com/emoji/48/sun-emoji.png";
    if ([1, 2, 3].includes(code)) return "https://img.icons8.com/emoji/48/sun-behind-cloud.png";
    if ([45, 48].includes(code)) return "https://img.icons8.com/emoji/48/fog.png";
    if ([51, 53, 55, 61, 63, 65].includes(code)) return "https://img.icons8.com/?size=100&id=ulJA5JddHJKv&format=png&color=000000";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "https://img.icons8.com/?size=100&id=3mAvveaCSg9x&format=png&color=000000";
    if ([95, 96, 99].includes(code)) return "https://img.icons8.com/?size=100&id=ESeqfDjC5eVO&format=png&color=000000";
    return "https://img.icons8.com/?size=100&id=2854&format=png&color=000000";
}