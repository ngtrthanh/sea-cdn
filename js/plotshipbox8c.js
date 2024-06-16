(function() {
    const d_URL = 'https://navitrack.hpradar.com';

    const markerClusterGroup = L.markerClusterGroup({
        disableClusteringAtZoom: 7
    });

    let countControl, ufoLayerGroup = L.layerGroup();

    function flagIcon(countryCode) {
        return `fi fi-${countryCode.toLowerCase()}`;
    }

    function getBounds() {
        const bounds = map.getBounds();
        const truncate = num => Math.floor(num * 10000) / 10000;
        const south = truncate(Math.max(-90, Math.min(90, bounds.getSouth())));
        const north = truncate(Math.max(-90, Math.min(90, bounds.getNorth())));
        const west = truncate(Math.max(-180, Math.min(180, bounds.getWest())));
        const east = truncate(Math.max(-180, Math.min(180, bounds.getEast())));

        return { south, north, west, east };
    }

    async function fetchData(url) {
        const response = await fetch(url);
        return await response.json();
    }

    function processChunk(chunk) {
        chunk.forEach(item => {
            const [MMSI, lat, lon, heading, speed, shiptype, shipname, country] = item;
            let marker, tooltipContent, icon;

            if (lat !== null && lon !== null) {
                if (MMSI >= 201000000 && MMSI <= 775999999) {
                    const shipColor = shipColors[parseInt(shiptype)] || "gray";
                    if (heading === null) {
                        marker = L.circleMarker([lat, lon], {
                            radius: 4,
                            color: shipColor,
                            fillOpacity: 0.9
                        });
                        tooltipContent = `<b>MMSI: ${MMSI}</b>  ${shipname}   ${getShipTypeVal(shiptype)}`;
                    } else {
                        const shipIconPath = "m 0 12 l 3 -12 l 3 12 c -2.25 -2 -3.75 -2 -6 0 z";
                        const svgIcon = shipIconSvg.replace(/{{SHIP_TYPE_COLOR}}/g, shipColor).replace(/{{SHIP_ICON_PATH}}/g, shipIconPath);
                        const encodedIcon = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgIcon);
                        const divIcon = L.divIcon({
                            className: "ship-icon",
                            html: `<img src="${encodedIcon}" style="transform: rotate(${heading}deg);">`,
                            iconSize: [10, 10],
                            iconAnchor: [5, 5]
                        });
                        marker = L.marker([lat, lon], { icon: divIcon, rotationAngle: heading });
                        tooltipContent = `<span class="fi fi-${country.toLowerCase()}"></span> <b>MMSI: ${MMSI}</b>, Hdng: ${heading}°, Type: ${getShipTypeVal(shiptype)}, Spd: ${speed}`;
                    }
                } else if (MMSI >= 2010000 && MMSI <= 7759999) {
                    marker = L.marker([lat, lon], { icon: markerIcons.baseStation });
                    tooltipContent = `<span class="fi fi-${country.toLowerCase()}"></span> <b>MMSI: ${MMSI}</b> Type: Base station`;
                } else if (MMSI >= 111201000 && MMSI <= 111775999) {
                    marker = L.marker([lat, lon], { icon: markerIcons.SAR });
                    tooltipContent = `<span class="fi fi-${country.toLowerCase()}"></span> <b>MMSI: ${MMSI}</b> Type: SAR`;
                } else if (MMSI >= 99201000 && MMSI <= 997759999) {
                    marker = L.marker([lat, lon], { icon: markerIcons.AtoN });
                    tooltipContent = `<span class="fi fi-${country.toLowerCase()}"></span> <b>MMSI: ${MMSI}</b> Type: AtoN Position: [${lat}, ${lon}]`;
                } else {
                    marker = L.marker([lat, lon], { icon: markerIcons.UFO });
                    tooltipContent = `<span class="fi fi-${country.toLowerCase()}"></span> <b>MMSI: ${MMSI}</b> Type: UFO ${getShipTypeVal(shiptype)}`;
                }

                marker.bindTooltip(tooltipContent, { className: 'my-tooltip' }).openTooltip();
                markerClusterGroup.addLayer(marker);
            }
        });
    }

    async function createMarkers() {
        try {
            const bounds = getBounds();
            const url = `${d_URL}/re-api-8/?box=${bounds.south},${bounds.north},${bounds.west},${bounds.east}`;
            const data = await fetchData(url);
            let mmsiCount = 0;
            let atonCount = 0;
            let sarCount = 0;
            let bstCount = 0;
            let ufoCount = 0;
            let shipCountS = 0;
            let shipCountA = 0;

            mmsiCount = data.values.length.toLocaleString();
            markerClusterGroup.clearLayers();

            const chunkSize = 400; // Adjust the chunk size as needed
            const delay = 100; // Adjust the delay as needed

            for (let i = 0; i < data.values.length; i += chunkSize) {
                const chunk = data.values.slice(i, i + chunkSize);
                processChunk(chunk);
                await new Promise(resolve => setTimeout(resolve, delay)); // delay between chunks
            }

            countControl && countControl.remove();
            countControl = L.control({ position: "topleft" });
            countControl.onAdd = function (map) {
                const div = L.DomUtil.create("div", "ship-count-box");
                div.innerHTML = `<span id="hpradar-link">© HPRadar</span> Traffic|📡${mmsiCount}|🚢${shipCountS.toLocaleString()}|⚓${shipCountA.toLocaleString()}|🗼${bstCount}|🚁${sarCount}|🛟${atonCount.toLocaleString()}|🛸${ufoCount}`;
                return div;
            };

            countControl.addTo(map);
            const a = document.getElementById("hpradar-link");
            a.addEventListener("mouseover", function() {
                a.style.cursor = "pointer",
                a.style.textDecoration = "underline"
            }),
            a.addEventListener("mouseout", function() {
                a.style.cursor = "default",
                a.style.textDecoration = "none"
            }),
            a.addEventListener("click", function() {
                window.location.href = "https://hpradar.com"
            }),
            map.addLayer(markerClusterGroup);
        } catch (error) {
            console.error("Failed to fetch or process data:", error);
        }
    }

    createMarkers();
    setInterval(createMarkers, 5 * 1000);
})();
