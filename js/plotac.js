(function() {
    const markers = L.markerClusterGroup({ disableClusteringAtZoom: 6 });
    const infoCard = createInfoCard(); // Create the info card element
    const acURL = '';

    // Initialize ZSTDDecoder and handle any initialization errors
    const zstdDecoder = new zstddec.ZSTDDecoder();
    zstdDecoder.init().catch(webAssemblyFail);

    async function createMarkers(ac_url) {
        try {
            const decodedData = await zstdDecoder.decode(new Uint8Array(await (await fetch(ac_url)).arrayBuffer()));
            wqi(decodedData);
            addAircraftMarkers(decodedData.aircraft);
        } catch (error) {
            console.error("Error fetching aircraft data:", error);
        }
    }

    function getBounds() {
        const bounds = map.getBounds();
        const south = Math.max(-90, Math.min(90, bounds.getSouth()));
        const north = Math.max(-90, Math.min(90, bounds.getNorth()));
        const west = Math.max(-180, Math.min(180, bounds.getWest()));
        const east = Math.max(-180, Math.min(180, bounds.getEast()));

        return `?binCraft&zstd&box=${south},${north},${west},${east}`;
    }

    function addAircraftMarkers(aircraftData) {
        markers.clearLayers();
        const aircraftCount = aircraftData.length;
        aircraftData.forEach(addAircraftMarker);
        map.addLayer(markers);
        drawChart(aircraftCount);
    }

    function addAircraftMarker(aircraft) {
        if (aircraft.lat === undefined || aircraft.lon === undefined) return;

        const iconInfo = getBaseMarker(
            aircraft.category, aircraft.t, null, aircraft.type, aircraft.alt_baro, null
        );
        const acshape = shapes[iconInfo[0]];
        if (!acshape) {
            console.error('Shape is undefined for aircraft:', aircraft);
            return shapes["unknown"];
        }

        const altitude = aircraft.alt_baro;
        const hueRotate = typeof altitude === 'number' ?
            Math.min(Math.max(altitude / 100, 25), 350) : 0;
        const iconColor = `hsl(${hueRotate}, 90%, 45%)`;
        const svgIcon = svgShapeToSVG(acshape, iconColor, '#ffffff', 0.2, iconInfo[1]);
        const extendedAircraftIcon = createExtendedAircraftIcon(svgIcon, aircraft.track);
        const marker = L.marker([aircraft.lat, aircraft.lon], { icon: new extendedAircraftIcon() });
        markers.addLayer(marker);

        marker.on('click', function (event) {
            showAircraftInfo(aircraft);
            event.originalEvent.stopPropagation();
        });

        tooltipContent = `<b>${aircraft.flight}</b> ${aircraft.hex} ${aircraft.t} Alt: ${aircraft.alt_baro} Hdg: ${parseFloat(aircraft.track).toFixed(0)}° Spd: ${aircraft.gs}`

        marker.bindTooltip(tooltipContent, { className: 'my-tooltip' }) //.openTooltip();

    }

    function createInfoCard() {
        const infoCard = document.createElement("div");
        infoCard.id = "info-card";
        infoCard.classList.add("info-card", "hidden");
        document.body.appendChild(infoCard);
        return infoCard;
    }

    async function showAircraftInfo(aircraft) {
        const infoContent = document.createElement("div");
        infoContent.innerHTML = `
            <p><b>Flight: ${aircraft.flight}</b></p>
            <p>Registration: ${aircraft.r}</p>
            <p>Aircraft Type: ${aircraft.t}</p>
            <p>Altitude: ${aircraft.alt_baro} ft</p>
            <p>Ground Speed: ${aircraft.gs} knots</p>
            <p>Track: ${parseFloat(aircraft.track).toFixed(0)}°</p>
            <p>Latitude: ${aircraft.lat}</p>
            <p>Longitude: ${aircraft.lon}</p>
        `;

        // Fetch photo information from the API
        const photoURL = `https://api.planespotters.net/pub/photos/hex/${aircraft.hex}`;
        try {
            const photoResponse = await fetch(photoURL);
            const photoData = await photoResponse.json();
            if (photoData.photos && photoData.photos.length > 0) {
                const photo = photoData.photos[0];
                const photoElement = document.createElement("div");
                photoElement.innerHTML = `
                    <p>Photo:</p>
                    <a href="${photo.link}" target="_blank">
                        <img src="${photo.thumbnail_large.src}" alt="Aircraft Photo" style="width: 220px";>
                    </a>
                    <p>Photographer: ${photo.photographer}</p>
                `;
                infoContent.appendChild(photoElement);
            }
        } catch (error) {
            console.error("Error fetching photo data:", error);
        }

        infoCard.innerHTML = "";
        infoCard.appendChild(infoContent);
        infoCard.classList.remove("hidden");
    }

    document.body.addEventListener('click', function (event) {
        if (!infoCard.contains(event.target)) {
            infoCard.classList.add('hidden');
        }
    });

    function createExtendedAircraftIcon(svgIcon, rotationAngle) {
        return L.Icon.extend({
            options: {
                iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                rotationAngle: rotationAngle || 0
            },

            createIcon: function (oldIcon) {
                var div = oldIcon && oldIcon.tagName === "DIV" ? oldIcon : document.createElement("div");
                var img = this._createImg(this.options["iconUrl"]);
                var angle = this.options["rotationAngle"] || 0;
                img.style.transform = "rotate(" + angle + "deg)";
                div.appendChild(img);
                this._setIconStyles(div, "icon");
                return div;
            },
        });
    }

    createMarkers(acURL + '/re-api/' + getBounds());
    setInterval(() => {
        createMarkers(acURL + '/re-api/' + getBounds());
    }, 2 * 1000);
})();
