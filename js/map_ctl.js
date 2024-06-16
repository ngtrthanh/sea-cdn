// Set the initial map center and zoom level
const initialCenter = [20.83, 106.72];
const initialZoomLevel = 5;

// Define WGS84 and VN2000 projections using EPSG codes
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:9210", "+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs +type=crs");

// Create the map instance and set the initial view
const map = L.map("map").setView(initialCenter, initialZoomLevel);

// Define the tile layers "yShyGLZC3JMFFIUecAOl", //
/* const opts = { */
/* 	key: "nRYox0R1ZyZ6XqSStq4S", */
/* 	accessToken: "qML7E6HmMKb6LQJgxHedkuht58y48dIpzawFGfCXdHzqnZWQlscx5zmyw7uYgTZG" */
/* }; */

const mtlKeys = ["nRYox0R1ZyZ6XqSStq4S", "yShyGLZC3JMFFIUecAOl"];
let idx = 0;
const opts = { get key() { return mtlKeys[idx]; }, accessToken: "qML7E6HmMKb6LQJgxHedkuht58y48dIpzawFGfCXdHzqnZWQlscx5zmyw7uYgTZG" };
idx = (idx + 1) % mtlKeys.length;

const LLP = L.tileLayer.provider;
const tileLayers = {
	"Toner Lite": LLP("Stadia.StamenTonerLite"),
	"Watercolor": LLP("Stadia.StamenWatercolor"),
	"Terrain": LLP("Stadia.StamenTerrain"),
	"ErsiWI": LLP("Esri.WorldImagery"),
	"MapTiler Street": LLP("MapTiler.Streets", opts),
	"MapTiler Ocean": LLP("MapTiler.Ocean", opts),
	"MapTiler Backdrop": LLP("MapTiler.Backdrop", opts),
	"MapTiler Dataviz": LLP("MapTiler.Dataviz", opts),
	"Jawg Terrain": LLP("Jawg.Terrain", opts),
	"Jawg Streets": LLP("Jawg.Streets", opts),
	"Stadia AlidadeSmooth": L.tileLayer.provider("Stadia.AlidadeSmooth"),
	"Stadia AlidadeSmoothDark": L.tileLayer.provider("Stadia.AlidadeSmoothDark"),
	"Stadia OSMBright": L.tileLayer.provider("Stadia.OSMBright"),
	"Stadia Outdoors": L.tileLayer.provider("Stadia.Outdoors"),
};

// Indices for the tiles you are interested in: 8, 11, 13
const interestedIndices = [4, 9, 10];

// Randomly select an index from interestedIndices
const randomIndex = interestedIndices[Math.floor(Math.random() * interestedIndices.length)];

// Get the key for the randomly selected index
const layerKey = Object.keys(tileLayers)[randomIndex];

// Get the selected layer using the random layer key
const selectedLayer = tileLayers[layerKey];

// Add the selected tile layer to the map as the initial layer
selectedLayer.addTo(map);

const mousePositionDiv = L.control({
    position: 'bottomleft'
});

mousePositionDiv.onAdd = function () {
    var div = L.DomUtil.create('div');
    div.id = 'mouse-position';
    return div;
};
mousePositionDiv.addTo(map);

map.on('mousemove', function (e) {
    var wgs84 = e.latlng.lat.toFixed(6) + ", " + e.latlng.lng.toFixed(6);
        var vn2000Lat = convertWgs84ToVN2000(e.latlng).lat.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
        var vn2000Lng = convertWgs84ToVN2000(e.latlng).lng.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
        var vn2000 = vn2000Lat + ", " + vn2000Lng;
    //document.getElementById('mouse-position').innerHTML = "WGS84: " + wgs84;// + "<br> VN2000: " + vn2000;
    document.getElementById('mouse-position').innerHTML = "LAT/LNG: " + wgs84 + " ZL: " + map.getZoom();
});

function convertWgs84ToVN2000(latlng) {
    var wgs84Coords = [latlng.lng, latlng.lat];
    var vn2000Coords = proj4("EPSG:4326", "EPSG:9210", wgs84Coords);
    return { lat: vn2000Coords[1], lng: vn2000Coords[0] };
}

// Define overlay layers
const overlayLayers = {};

async function getRainviewerLayers(key) {
    const response = await fetch("https://api.rainviewer.com/public/weather-maps.json", { credentials: "omit" });
    const jsonData = await response.json();
    return jsonData[key];
}

const rainviewerRadar = L.tileLayer('', {
    opacity: 0.25,
    zIndex: 999,
    maxZoom: 20,
});

async function refreshRainviewerRadar() {
    const latestLayer = await getRainviewerLayers('radar');
    const rainviewerRadarSource = 'https://tilecache.rainviewer.com/v2/radar/' + latestLayer.past[latestLayer.past.length - 1].time + '/512/{z}/{x}/{y}/6/1_1.png';
    rainviewerRadar.setUrl(rainviewerRadarSource);
}

rainviewerRadar.on('add', function () {
    refreshRainviewerRadar();
    this.refreshRainviewerRadarInterval = setInterval(refreshRainviewerRadar, 2 * 60 * 1000);
});

rainviewerRadar.on('remove', function () {
    clearInterval(this.refreshRainviewerRadarInterval);
});

const rainviewerClouds = L.tileLayer('', {
    opacity: 0.15,
    zIndex: 999,
    maxZoom: 20,
});

async function refreshRainviewerClouds() {
    const latestLayer = await getRainviewerLayers('satellite');
    const rainviewerCloudsSource = 'https://tilecache.rainviewer.com/' + latestLayer.infrared[latestLayer.infrared.length - 1].path + '/512/{z}/{x}/{y}/0/0_0.png';
    rainviewerClouds.setUrl(rainviewerCloudsSource);
}

rainviewerClouds.on('add', function () {
    refreshRainviewerClouds();
    this.refreshRainviewerCloudsInterval = setInterval(refreshRainviewerClouds, 2 * 60 * 1000);
});

rainviewerClouds.on('remove', function () {
    clearInterval(this.refreshRainviewerCloudsInterval);
});

overlayLayers["RainViewer Radar"] = rainviewerRadar;
overlayLayers["RainViewer Clouds"] = rainviewerClouds;

map.removeControl(map.zoomControl);

L.control.layers(tileLayers, overlayLayers, {
    position: 'bottomright'
}).addTo(map);

L.control.zoom({
	position: 'bottomright'
}).addTo(map);


const darkModeLayers = ["ErsiWI","Stadia AlidadeSmoothDark"];

// "Watercolor", "Terrain", "MapTiler Ocean", "MapTiler Backdrop", "Jawg Terrain", 

// Function to toggle button color based on dark mode selection

function toggleButtonColor(isDarkMode) {
    const button = document.getElementById("toggle-sidebar");
    const svg = button.querySelector("svg");

    // Get the first <path> element
    const firstPath = svg.children[0];
    // Get the second <path> element
    const secondPath = svg.children[1];
    
    if (isDarkMode) {
        firstPath.setAttribute("fill", "#EAD61C"); // Change first path color to black for dark mode
        secondPath.setAttribute("fill", "#EAD61C"); // Change second path color to black for dark mode
    } else {
        firstPath.setAttribute("fill", "#1F2328"); // Change first path color to original for light mode
        secondPath.setAttribute("fill", "#1F2328"); // Change second path color to original for light mode
    }
}

// Detect when a new tile layer is added to the map
map.on("baselayerchange", function (event) {
    const selectedLayerName = event.name;
    const isDarkMode = darkModeLayers.includes(selectedLayerName);
    toggleButtonColor(isDarkMode);
});

// Set the initial button color based on the initial tile layer
const initialLayerName = "MapTiler Backdrop"; // Example initial tile layer name
const initialIsDarkMode = darkModeLayers.includes(initialLayerName);
toggleButtonColor(initialIsDarkMode);



