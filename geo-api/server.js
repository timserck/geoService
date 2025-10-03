const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = 8443;

// Autoriser ton front (React dev ou prod)
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.190:3000",
  "https://timserck.duckdns.org"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl / scripts
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Fallback: get coordinates from ipinfo.io (gratuit, plus précis)
const getCoords = async () => {
  try {
    const res = await fetch("https://ipinfo.io/json?token=TON_TOKEN"); // Remplace TON_TOKEN par ton token gratuit
    const data = await res.json();
    const [lat, lon] = data.loc.split(",");
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      city: data.city,
      region: data.region,
      country: data.country,
    };
  } catch (err) {
    console.error("IP geolocation failed:", err);
    return null;
  }
};

// Reverse geocode using Nominatim public API
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    return data.display_name;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return null;
  }
};

// API endpoint
app.get("/", async (req, res) => {
  const coords = await getCoords();
  if (!coords) return res.status(500).json({ error: "Cannot get coordinates" });

  const address = await reverseGeocode(coords.latitude, coords.longitude);

  res.json({
    latitude: coords.latitude,
    longitude: coords.longitude,
    fallbackCity: coords.city,
    fallbackRegion: coords.region,
    fallbackCountry: coords.country,
    address, // si reverse geocode fonctionne
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌍 Geo API running at https://localhost:${PORT}`);
});
