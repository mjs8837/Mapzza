import * as map from './map.js';

//Initializing everything
function init(){
    map.initMap();
    map.addMarkersToMap();
    setupUI();
}

//Setting up the UI for the buttons and rating dropdown
function setupUI(){
    btn1.onclick = () => {
        map.setHomeLocation();
    }

    btn2.onclick = () => {
        map.setMarkerCenter();
    }

    //Showing the list of pizza places
    btn3.onclick = () => {
        map.changeVisibility();
    }

    //Reset Button
    btn4.onclick = () => {
        localStorage.clear();
        map.initMap();
        map.addMarkersToMap();
        rating.value = 0;
    }

    rating.onchange = () => {
        localStorage.setItem("rating", rating.value);
        map.onDragEnd();
    }
  }

export {init};