(function() {
    const d_URL = 'https://navitrack.hpradar.com';

    const markerClusterGroup = L.markerClusterGroup({
        disableClusteringAtZoom: 11
    });

    let countControl, ufoLayerGroup = L.layerGroup();

    function getBounds() {
        const bounds = map.getBounds();
        const truncate = num => Math.floor(num * 10000) / 10000;
        const south = truncate(Math.max(-90, Math.min(90, bounds.getSouth())));
        const north = truncate(Math.max(-90, Math.min(90, bounds.getNorth())));
        const west = truncate(Math.max(-180, Math.min(180, bounds.getWest())));
        const east = truncate(Math.max(-180, Math.min(180, bounds.getEast())));

        return { south, north, west, east };
    }


    async function createMarkers() {
        try {
            const bounds = getBounds();
            const url = `${d_URL}/re-api/?box=${bounds.south},${bounds.north},${bounds.west},${bounds.east}`;
            const response = await fetch(url);
            const data = await response.json();
            let mmsiCount = 0;
            let atonCount = 0;
            let sarCount = 0;
            let bstCount = 0;
            let ufoCount = 0;
            let shipCountS = 0;
            let shipCountA = 0;

            mmsiCount = data.values.length.toLocaleString();
            markerClusterGroup.clearLayers();

            data.values.forEach(item => {
                const [MMSI, lat, lon, distance, bearing, level, count, ppm, approx, heading, cog, speed, to_bow, to_stern, to_starboard, to_port, last_group, group_mask, shiptype, mmsi_type, shipclass, validated, msg_type, channels, country, status, draught, eta_month, eta_day, eta_hour, eta_minute, imo, callsign, shipname, destination, last_signal] = item;

                let marker, tooltipContent, icon;

                if (lat !== null && lon !== null) {
                    if (MMSI >= 201000000 && MMSI <= 775999999) {
                        const shipColor = shipColors[parseInt(shiptype)] || "gray";
                        if (heading === null) {
                            shipCountA++;
                            marker = L.circleMarker([lat, lon], {
                                radius: 4,
                                color: shipColor,
                                fillOpacity: 0.9
                            });
                            tooltipContent = `MMSI: ${MMSI}  ${shipname}  ${shiptype}`;
                        } else {
                            shipCountS++;
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
                            tooltipContent = `<b>MMSI: ${MMSI} </b> Heading: ${heading}° shiptype: ${shiptype} Position: [${lat}, ${lon}] speed:${speed}`;
                        }
                    } else if (MMSI >= 2010000 && MMSI <= 7759999) {
                        bstCount++;
                        marker = L.marker([lat, lon], { icon: markerIcons.baseStation });
                        tooltipContent = `MMSI: ${MMSI}<br>Type: Base station`;
                    } else if (MMSI >= 111201000 && MMSI <= 111775999) {
                        sarCount++;
                        marker = L.marker([lat, lon], { icon: markerIcons.SAR });
                        tooltipContent = `MMSI: ${MMSI}<br>Type: SAR`;
                    } else if (MMSI >= 99201000 && MMSI <= 997759999) {
                        atonCount++;
                        marker = L.marker([lat, lon], { icon: markerIcons.AtoN });
                        tooltipContent = `MMSI: ${MMSI}<br>Type: AtoN<br>Position: [${lat}, ${lon}]`;
                    } else {
                        ufoCount++;
                        marker = L.marker([lat, lon], { icon: markerIcons.UFO });
                        tooltipContent = `MMSI: ${MMSI}<br>Type: UFO<br>shiptype: ${shiptype}`;
                    }

                    marker.bindTooltip(tooltipContent, { className: 'my-tooltip' }).openTooltip();
                    markerClusterGroup.addLayer(marker);
                }
            });

            countControl && countControl.remove();
            countControl = L.control({ position: "topleft" });
            countControl.onAdd = function (map) {
                const div = L.DomUtil.create("div", "ship-count-box");
                div.innerHTML = `<span id="hpradar-link">© HPRadar</span> Navitrack|📡${mmsiCount}|🚢${shipCountS.toLocaleString()}|⚓${shipCountA.toLocaleString()}|🗼${bstCount}|🚁${sarCount}|🛟${atonCount.toLocaleString()}|🛸${ufoCount}`;
                return div;
            };

            countControl.addTo(map);
            map.addLayer(markerClusterGroup);
        } catch (error) {
            console.error("Failed to fetch or process data:", error);
        }
    }

    createMarkers();
    map.on('moveend', createMarkers);  // Update markers on map move end
    setInterval(createMarkers, 20 * 1000);  // Periodic update every 30 seconds
})();
