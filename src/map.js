import * as ajax from "./ajax.js"

let poi;
let map;
let marker;
let currentMarkers = [];
let currentStores = [];
let defaultCoords = [-77.67454147338866, 43.08484339838443];
let currentHome = {
    lng: 0,
    lat: 0
};

//Initializing the map
function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWpzODgzNyIsImEiOiJja2hmNndmam0wbnc5MnhyenkxZnVwdG5zIn0.0yzYKhedWY0aE1jYfs8rOA';

    //Checking if there is anything in local storage and setting it if there is not
    if (localStorage.getItem("storedCoords") == undefined) {
        localStorage.setItem("storedCoords", defaultCoords);
        currentHome.lng = defaultCoords[0];
        currentHome.lat = defaultCoords[1];
    }
    //Setting the value of the current home array 
    else {
        let tempCoords = localStorage.getItem("storedCoords");
        currentHome.lng = tempCoords.substring(0, tempCoords.indexOf(","));
        currentHome.lat = tempCoords.substring(tempCoords.indexOf(",") + 1, tempCoords.length);
    }

    //Setting the rating in local storage
    if (localStorage.getItem("rating") != undefined) {
        rating.value = localStorage.getItem("rating");
    }

    //Creating the map
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [currentHome.lng, currentHome.lat],
        zoom: 12.5
    });

    //Setting up the layers of the map
    map.on('load', function () {
        // Insert the layer beneath any symbol layer.
        let layers = map.getStyle().layers;

        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }

        map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': '#aaa',

                // use an 'interpolate' expression to add a smooth transition effect to the
                // buildings as the user zooms in
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
            }
        },
            labelLayerId
        );
    });

    //Setting up the geocoder for location searching
    let geocoder = new MapboxGeocoder({ // Initialize the geocoder
        accessToken: mapboxgl.accessToken, // Set the access token
        mapboxgl: mapboxgl, // Set the mapbox-gl instance
        marker: false, // Do not use the default marker style
        placeholder: 'Search for a location'
    });

    // Add the geocoder to the map
    map.addControl(geocoder);
}

//Calling the method for the moveable marker
function addMarkersToMap() {
    marker = new mapboxgl.Marker({
        draggable: true
    })
        .setLngLat([currentHome.lng, currentHome.lat])
        .addTo(map);

    marker.on('dragend', onDragEnd);

    onDragEnd();
}

//Writing out the list of pizza places
function listPizza() {
    let ul = document.querySelector("#pizzaList");

    ul.innerHTML = "";

    let li;

    for (let c of currentStores) {
        li = document.createElement("li");
        li.innerHTML = c.name;
        li.onclick = () => {
            setZoomLevel(17.5);
            flyTo([c.coordinates.longitude, c.coordinates.latitude]);
        }

        ul.appendChild(li);
    }
}

//Setting up the draggable marker for generating pizza places and loading in the url for the yelp api based on location
function onDragEnd() {
    let lngLat = marker.getLngLat();
    let newUrl = "https://people.rit.edu/mjs8837/330/project3/yelp-proxy.php";
    newUrl += "?term=pizza&latitude=" + lngLat.lat + "&longitude=" + lngLat.lng;

    for (let c of currentMarkers) {
        c.remove();
    }
    currentMarkers = [];
    currentStores = [];

    function poiLoaded(jsonString) {
        poi = JSON.parse(jsonString);

        let rating = document.querySelector("#rating").value;

        for (let b of poi.businesses) {
            if (rating <= b.rating) {
                let tempCoordinates = [b.coordinates.longitude, b.coordinates.latitude];
                addMarker(tempCoordinates, b.name, b.phone, "poi");
                currentStores.push(b);
            }
        }

        listPizza();
    }
    ajax.downloadFile(newUrl, poiLoaded);
}

//Setting the home location for next time the page is loaded in the browser
function setHomeLocation() {
    let tempCoords = [marker.getLngLat().lng, marker.getLngLat().lat];
    localStorage.setItem("storedCoords", tempCoords);
    currentHome.lng = tempCoords[0];
    currentHome.lat = tempCoords[1];
}

//Setting the marker to the center of the map
function setMarkerCenter() {
    marker.setLngLat(map.getCenter());
    onDragEnd();
    setZoomLevel(10);
}

//Changing the visibility of the pizza list
function changeVisibility() {
    if (document.querySelector("#listDiv").style.visibility == "visible") {
        document.querySelector("#listDiv").style.visibility = "hidden";
        document.querySelector("#btn3").innerHTML = "Show List of Pizza Places";
    } else {
        document.querySelector("#listDiv").style.visibility = "visible";
        document.querySelector("#btn3").innerHTML = "Hide List of Pizza Places";
    }

}

//Moving the center of the camera
function flyTo(center = [0, 0]) {
    map.flyTo({ center: center });
}

//Setting the zoom level of the map
function setZoomLevel(value = 0) {
    map.setZoom(value);
}

//Setting the view angle
function setPitchAndBearing(pitch = 0, bearing = 0) {
    map.setPitch(pitch);
    map.setBearing(bearing);
}

//Helper method to add a marker with specific information
function addMarker(coordinates, title, description, className) {
    let el = document.createElement('div');
    el.className = className;
    if (description == "") {
        currentMarkers.push(
            new mapboxgl.Marker(el)
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                    .setHTML('<h3>Restaurant: ' + title + '<h3><p>Phone Number: N/A</p>'))
                .addTo(map));
    } else {
        currentMarkers.push(
            new mapboxgl.Marker(el)
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                    .setHTML('<h3>Restaurant: ' + title + '<h3><p>Phone Number: ' + description + '</p>'))
                .addTo(map));
    }
}

export { initMap, addMarkersToMap, onDragEnd, flyTo, changeVisibility, setMarkerCenter, setZoomLevel, setPitchAndBearing, addMarker, setHomeLocation };