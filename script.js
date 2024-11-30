let map;
let markers = [];

async function initMap() {
    // Inicializace mapy na výchozí polohu (Praha)
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 50.0755, lng: 14.4378 }, // Praha
        zoom: 13,
    });

    const location = map.getCenter();
    searchPlaces(location, 5000, 0); // Výchozí vzdálenost 5000 m, hodnocení 0
}

window.onload = initMap;

function searchPlaces(location, radius, minRating) {
    // Vymazání stávajících markerů
    clearMarkers();

    const request = {
        location: location,
        radius: radius,
        type: ["restaurant"],
    };

    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results, status) => {
        console.log("Status:", status);
        console.log("Results:", results);

        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Filtrování podle hodnocení
            const filteredResults = results.filter(place => place.rating >= minRating);
            console.log("Filtered Results:", filteredResults);

            filteredResults.forEach((place) => {
                createMarker(place);
                adjustBoundsToMarkers(markers);
                updateResultList(filteredResults);
            });
        } else {
            alert("Hledání restaurací selhalo. Status: " + status);
        }
    });
}

function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name,
    });

    place.marker = marker;

    marker.addListener("click", () => {
        const infoWindow = new google.maps.InfoWindow({
            content: `<h3>${place.name}</h3>
                      <p>${place.vicinity}</p>
                      <p>Hodnocení: ${place.rating || "N/A"}</p>
                      ${place.photos ? `<img src="${place.photos[0].getUrl({maxWidth: 120, maxHeight: 90})}" style="width:100%; border-radius: 5px;" />` : ''}
                      `,
        });
        infoWindow.open(map, marker);
    });

    // Přidání markeru do pole
    markers.push(marker);
}

document.getElementById("searchForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Zabráníme defaultnímu odeslání formuláře

    const city = document.getElementById("locationInput").value;
    const radius = parseInt(document.getElementById("radiusInput").value, 10) || 5000;
    const minRating = parseFloat(document.getElementById("ratingFilter").value) || 0;

    if (!city) {
        alert("Zadejte město.");
        return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: city }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            searchPlaces(location, radius, minRating);
        } else {
            alert("Město nebylo nalezeno!");
        }
    });
});

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null)); // Odstraní marker z mapy
    markers = []; // Vyprázdní pole
}

function updateResultList(places) {
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = ""; // Vymazání stávajících výsledků

    places.forEach(place => {
        const listItem = document.createElement("div");
        listItem.className = "place-item";
        listItem.innerHTML = `
            <strong>${place.name}</strong><br>
            ${place.vicinity}<br>
            Hodnocení: ${place.rating || "N/A"} ⭐
        `;

        // Kliknutím na položku zvýrazněte marker
        listItem.addEventListener("click", () => {
            map.setCenter(place.geometry.location);
            google.maps.event.trigger(place.marker, "click");
        });

        resultList.appendChild(listItem);
    });
}

function adjustBoundsToMarkers(markers) {
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
}

document.getElementById("geoBtn").addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const location = new google.maps.LatLng(lat, lng);

            // Nastavíme centrum mapy na aktuální polohu
            map.setCenter(location);

            // Zavoláme searchPlaces s aktuální polohou
            const radius = parseInt(document.getElementById("radiusInput").value, 10) || 5000;
            const minRating = parseFloat(document.getElementById("ratingFilter").value) || 0;
            searchPlaces(location, radius, minRating);
        }, () => {
            alert("Nepodařilo se získat vaši polohu.");
        });
    } else {
        alert("Geolokace není podporována vaším prohlížečem.");
    }
});