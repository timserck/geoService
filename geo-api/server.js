const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors"); // ✅ add CORS

const app = express();
const PORT = 8443;

// ✅ Enable CORS for all requests
app.use(cors());

// (Optional, production: restrict to your domain only)
app.use(cors({ origin: "https://timserck.duckdns.org" }));

// Fallback: get coordinates from GeoJS
const getCoords = async () => {
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
    const data = await res.json();
    return { latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude) };
  } catch {
    return null;
  }
};

// Reverse geocode using local Nominatim
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(`http://nominatim:8080/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return data.display_name;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return null;
  }
};

// API endpoint
app.get("/location", async (req, res) => {
  let coords = await getCoords();
  if (!coords) return res.status(500).json({ error: "Cannot get coordinates" });

  const address = await reverseGeocode(coords.latitude, coords.longitude);
  res.json({ latitude: coords.latitude, longitude: coords.longitude, address });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Geo API running at http://localhost:${PORT}`);
});
