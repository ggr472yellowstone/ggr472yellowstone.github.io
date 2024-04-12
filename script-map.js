/*--------------------------------------------------------------------
INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiamFtaWVjaG93IiwiYSI6ImNsczI5a2oxeDBqc3QybHBhZDRrYnJoMWoifQ.wLIXAScEoL9dMScxZBBjuw'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/jamiechow/cltxk4kuh01gd01qe78w2akru',  // ****ADD MAP STYLE HERE *****
    center: [-110.594038, 44.6],  // starting point, longitude/latitude
    zoom: 8.2 // starting zoom level
});


/*--------------------------------------------------------------------
VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let geojson1;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/ggr472yellowstone/ggr472yellowstone.github.io/main/data/FinalBirdDataset.json')
    .then(response => response.json())
    .then(response => {
        geojson1 = response; // Store geojson as variable using URL from fetch response
    });

    map.on('load', () => {

        // Adding trails
        map.addSource('trail', {
          type: 'geojson',
          data: 'https://raw.githubusercontent.com/ggr472yellowstone/ggr472yellowstone.github.io/main/data/Trails.json' // Your URL to your uoft.geojson file
          });
          map.addLayer({
          'id': 'trail-data',
          'type': 'line',
          'source': 'trail',
          'paint': {
            'line-color': '#633423'
            }
        });

         // Adding the border
         map.addSource('extent', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/ggr472yellowstone/ggr472yellowstone.github.io/main/data/YellowstoneExtent.json' // Your URL to your uoft.geojson file
            });
            map.addLayer({
            'id': 'extent-data',
            'type': 'line',
            'source': 'extent',
            'paint': {
                'line-color': 'green',
                'line-width': 2
              }
          });

        // Adding hotspots
        map.addSource('hotspot', {
          type: 'geojson',
          data: 'https://raw.githubusercontent.com/ggr472yellowstone/ggr472yellowstone.github.io/main/data/hotspots.json' // Your URL to your uoft.geojson file
          });
          map.addLayer({
          'id': 'hotspot-data',
          'type': 'symbol',
              'source': 'hotspot',
              'layout': {
          'text-field': ['get', 'Title'],
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          },
    });

        });

/*--------------------------------------------------------------------
    CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

map.on('load', () => {

    let filterYear = ['>=', ['number', ['get', 'year']], 2010];
    let filterSeason = ['!=', ['number', ['get', 'month']], 0];
    let filterBird = ['has', 'species'];

    let bboxgeojson;
    let bbox = turf.envelope(geojson1);

    bboxgeojson = {
        "type" : "FeatureCollection",
        "features": [bbox]
    }

    let bboxcoords = [bbox.geometry.coordinates [0][0][0],
                bbox.geometry.coordinates [0][0][1],
                bbox.geometry.coordinates [0][2][0],
                bbox.geometry.coordinates [0][2][1]];
    let hexgeojson= turf.hexGrid(bboxcoords, 5, {units:'kilometers'});

    let eaglehex = turf.collect(hexgeojson, geojson1, '_id', 'values')

    let maxeagle = 0; // make a "counter" which starts at default from 0

    eaglehex.features.forEach((feature) => {   //for each hexgon feature in eaglehex
        feature.properties.COUNT = feature.properties.values.length     // let the property of "COUNT" equal the number of eagles 
        //  (this is done by measuring the length of the list of the individual eagles)
        if (feature.properties.COUNT > maxeagle) {     // if "COUNT" is greater than the "counter" maxeagle, then:
            maxeagle = feature.properties.COUNT    // maxeagle will take on the value of "COUNT"
        }   // this is done until the max is identified
    }
    );
    
    map.addSource('eagle-geojson', {
        'type': 'geojson',
        data:geojson1
    });

    map.addLayer({
        'id': 'eagle-point',
        'type': 'circle',
        'source': 'eagle-geojson',
        'paint': {
            'circle-radius': 3,
            'circle-color': 'black',
            'circle-opacity': 0.5,
        },
        'filter': ['all', filterYear, filterSeason, filterBird]
    });


    // add fill of hexagons
    map.addSource('hex-source', {
        type:'geojson',
        data:hexgeojson
    })
    map.addLayer(
        {
            'id': 'hex-layer',
            'type': 'fill',
            'source': 'hex-source',
            'paint': {
                'fill-color': [
                    'step',
                    ['get', 'COUNT'],
                    '#2dc4b2', 10,
                    '#3bb3c3', 50,
                    '#669ec4', 200, 
                    '#669ec4', 600, 
                    '#8b88b6', 1000, 
                    '#a2719b'
                ],
                'fill-opacity': [
                    'step',
                    ['get', 'COUNT'],
                    0,
                    1, 0.4
                ]
                }
          }
    )

/*--------------------------------------------------------------------
ADD POP-UP ON CLICK EVENT
--------------------------------------------------------------------*/
map.on('click', 'hex-layer', (e) =>{
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<b>Golden Eagle Count: </b>' + e.features[0].properties.COUNT+ "<br>")
        .addTo(map);
});

/*--------------------------------------------------------------------
CREATE LEGEND INTERACTIVITY
--------------------------------------------------------------------*/

// Create checkbox to activate legend

let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true;
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none";
        legendcheck.checked = false;
    }
});

/*--------------------------------------------------------------------
CREATE SLIDER INTERACTIVITY
--------------------------------------------------------------------*/

let slidercheck = document.getElementById('slidercheck');

slidercheck.addEventListener('click', () => {
    if (slidercheck.checked) {
        slidercheck.checked = true;
        sliderbar.style.display = 'block';
    }
    else {
        sliderbar.style.display = "none";
        slidercheck.checked = false;
    }
});

/*--------------------------------------------------------------------
SHOW SIGHTINGS MAP BASED ON INTERACTIVITY
--------------------------------------------------------------------*/

// Change map layer display based on check box 
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'eagle-point',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

// Filter based on slider year
document.getElementById('slider').addEventListener('input', (e) => {
    const year = parseInt(e.target.value);
    // update the map

    filterYear = ['>=', ['number', ['get', 'year']], year];
    map.setFilter('eagle-point', ['all', filterYear, filterSeason, filterBird]);
  
    // update text in the UI
    document.getElementById('active-year').innerText = year;
  });

// Filter summer/winter
document.getElementById('filters').addEventListener('change', (e) => {
const season = e.target.value;
  // update the map filter
  if (season === 'all') {
    filterSeason = ['!=', ['number', ['get', 'month']], 0];
  } else if (season === 'summer') {
    filterSeason = ['match', ['get', 'month'], [4, 5, 6, 7, 8, 9], true, false];
  } else if (season === 'winter') {
    filterSeason = ['match', ['get', 'month'], [10, 11, 12, 1, 2, 3], true, false];
  } else {
    console.log('error');
  }
  map.setFilter('eagle-point', ['all', filterYear, filterSeason, filterBird]);
});

// Add event listener which returns map view to full screen on button click using flyTo method
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
      center: [-110.594038, 44.6], // starting position [lng, lat]
      zoom: 8.2, // starting zoom
      essential: true
    });
  });

// Initialize filters
let birdcheck;
const changeText = document.querySelector("#change-text");
const changeHeader = document.querySelector("#change-header");
const changeImage = document.querySelector("#change-image");
const infobox = document.getElementById('infobox');

document.getElementById("birdfieldset").addEventListener('change',(e) => {   
birdcheck = document.getElementById('bird').value;

    // create the text, header, display, image for each pop up box when a bird species is selected, and change them based on the selection
    let birdtext;
    let birdheader;
    let birddisplay;
    let birdimage;

    if (birdcheck == 'All'){
        filterBird = ['has', 'species'];
        birddisplay = 'none';
    }
    else if (birdcheck == 'Bucephala albeola'){
        filterBird = ['==', ['get', 'species'], 'Bucephala albeola'];
        birdtext = 'Duck is the common name for numerous species of waterfowl in the family Anatidae, the Bufflehead is one of the smallest North American ducks and has an increasing population. '+
        ' They are commonly found in YNP throughout all seasons and are a breeding species in the park.';
        birdheader = 'Bufflehead Duck - Bucephala Albeola';
        birddisplay = 'block';
        birdimage='images/bird1.jpg'
    }
    else if (birdcheck == 'Mergus merganser'){
        filterBird = ['==', ['get', 'species'], 'Mergus merganser'];
        birdtext= 'In the Anatidae family, this duck is of low concern in conservation status and can live for 12 to 13 years.' + 
            ' The Common Merganser is commonly found in YNP throughout all seasons and is a breeding species in the park.';
        birdheader = 'Common Merganser - Mergus Merganser';
        birddisplay = 'block'
        birdimage='images/bird2.jpg'
    }
    else if (birdcheck == 'Haliaeetus leucocephalus'){
        filterBird = ['==', ['get', 'species'], 'Haliaeetus leucocephalus'];
        birdtext= 'A bird of prey, the Bald Eagle is the national symbol of the United States. They can live for 20-30 years and mate for life.'+
            ' These raptors are commonly found in YNP throughout all seasons and are a breeding species in the park.';
        birdheader = 'Bald Eagle - Haliaeetus Leucocephalus';
        birddisplay = 'block'
        birdimage='images/bird3.jpg'
    }
    else if (birdcheck == 'Bubo virginianus'){
        filterBird = ['==', ['get', 'species'], 'Bubo virginianus'];
        birdtext= 'The Great Horned Owl belongs to the owl family Strigidae. These birds are nocturnal and native to North America.'+
            ' They are commonly found in YNP throughout all seasons and are a breeding species in the park.';
        birdheader = 'Great Horned Owl - Bubo Virginianus';
        birddisplay = 'block'
        birdimage='images/bird4.jpg'
    }
    else if (birdcheck == 'Leuconotopicus villosus'){
        filterBird = ['==', ['get', 'species'], 'Leuconotopicus villosus'];
        birdtext= 'This small yet powerful species is particularly known for their excavating abilities.'+
            ' They are common in all seasons, and a breeding species in YNP.';
        birdheader = 'Hairy Woodpecker - Leuconotopicus Villosus';
        birddisplay = 'block'
        birdimage='images/bird5.jpg'
    }
    else if (birdcheck == 'Myadestes townsendi'){
        filterBird = ['==', ['get', 'species'], 'Myadestes townsendi'];
        birdtext= 'The Townsend’s Solitaire is the only solitaire native to North America. They are medium-sized birds that eat mostly insects.'+
            ' They are common in all seasons, and a breeding species in YNP.';
        birdheader = 'Townsend’s Solitaire - Myadestes Townsendi';
        birddisplay = 'block'
        birdimage='images/bird6.jpg'
    }
    else if (birdcheck == 'Sitta canadensis'){
        filterBird = ['==', ['get', 'species'], 'Sitta canadensis'];
        birdtext= 'A species known for its tendency to creep down trees, they see the world from upside down!'+
            ' They are common in all seasons, and a breeding species in YNP.';
        birdheader = 'Red-breasted Nuthatch - Sitta Canadensis';
        birddisplay = 'block'
        birdimage='images/bird7.jpg'
    }
    else if (birdcheck == 'Gymnorhinus cyanocephalus'){
        filterBird = ['==', ['get', 'species'], 'Gymnorhinus cyanocephalus'];
        birdtext= 'This crestless blue jay belongs to the Corvidae family and is a ground forager in the Western region of the US.'+
            ' They are rare in all seasons in YNP.';
        birdheader = 'Pinyon Jay - Gymnorhinus Cyanocephalus';
        birddisplay = 'block'
        birdimage='images/bird8.jpg'
    }
    else if (birdcheck == 'Aegolius funereus'){
        filterBird = ['==', ['get', 'species'], 'Aegolius funereus'];
        birdtext= 'The most extremely sexually dimorphic American Owl, in which the female can be 2 times heavier and larger than the male.'+
            ' They are rare in all seasons, and a breeding species in YNP.';
        birdheader = 'Boreal Owl - Aegolius Funereus';
        birddisplay = 'block'
        birdimage='images/bird9.jpg'
    }
    else if (birdcheck == 'Picoides arcticus'){
        filterBird = ['==', ['get', 'species'], 'Picoides arcticus'];
        birdtext= 'This species is known for making its home in charred forests.'+
            ' They are rare in all seasons, and a breeding species in YNP.';
        birdheader = 'Black-backed Woodpecker - Picoides Arcticus';
        birddisplay = 'block'
        birdimage='images/bird10.jpg'
    }
    else if (birdcheck == 'Haemorhous mexicanus'){
        filterBird = ['==', ['get', 'species'], 'Haemorhous mexicanus'];
        birdtext= 'This species can vary drastically based on its habitat, and can look unrecognizable from one region to the next.'+
            ' They are rare in all seasons at YNP.';
        birdheader = 'House Finch - Haemorhous Mexicanus';
        birddisplay = 'block'
        birdimage='images/bird11.jpg'
    }
    else if (birdcheck == 'Loxia leucoptera'){
        filterBird = ['==', ['get', 'species'], 'Loxia leucoptera'];
        birdtext= 'This species breeding season is opportunistic, meaning that they breed when their resources are sufficient.'+
            ' They are rare in all seasons at YNP.';
        birdheader = 'White-winged Crossbill - Loxia Leucoptera';
        birddisplay = 'block'
        birdimage='images/bird12.jpg'
    }
    else if (birdcheck == 'Spinus tristis'){
        filterBird = ['==', ['get', 'species'], 'Spinus tristis'];
        birdtext= 'These small and vibrant acrobatic finches are rarely found in any season at YNP.'+
            ' But the American Goldfinch is a breeding species in the park.';
        birdheader = 'American Goldfinch - Spinus Tristis';
        birddisplay = 'block'
        birdimage='images/bird13.jpg'
    }
    else if (birdcheck == 'Rallus limicola'){
        filterBird = ['==', ['get', 'species'], 'Rallus limicola'];
        birdtext= 'A chicken-like bird in the family Rallidae, which can be seen creeping through shallow water like marshes.'+
            ' They are rare in all seasons at YNP but are a breeding species in the park.';
        birdheader = 'Virginia Rail - Rallus Limicola';
        birddisplay = 'block'
        birdimage='images/bird14.jpg'
    }
    else if (birdcheck == 'Cygnus buccinator'){
        filterBird = ['==', ['get', 'species'], 'Cygnus buccinator'];
        birdtext= 'One of the largest bird species in the world. Males are called cobs, while females are called pens and they are known to mate for life.'+
            ' A monitored and breeding species in the park.';
        birdheader = 'Trumpeter Swan - Cygnus Buccinator';
        birddisplay = 'block'
        birdimage='images/bird15.jpg'
    }
    else if (birdcheck == 'Aquila chrysaetos'){
        filterBird = ['==', ['get', 'species'], 'Aquila chrysaetos'];
        birdtext= 'The largest and fastest of all raptors.'+
            ' The Golden Eagle is a breeding and monitored species in the park.';
        birdheader = 'Golden Eagle - Aquila Chrysaetos';
        birddisplay = 'block'
        birdimage='images/bird16.jpg'
    }
    else if (birdcheck == 'Gavia immer'){
        filterBird = ['==', ['get', 'species'], 'Gavia immer'];
        birdtext= 'A species of duck in the Anatidae family with red eyes and a pointed bill.'+
            ' This is a breeding and monitored species in the park.';
        birdheader = 'Common Loon - Gavia Immer';
        birddisplay = 'block'
        birdimage='images/bird17.jpg'
    }
    else if (birdcheck == 'Pandion haliaetus'){
        filterBird = ['==', ['get', 'species'], 'Pandion haliaetus'];
        birdtext= 'This widely distributed species of raptor has been alive for millions of years and can travel thousands of miles in a month.'+
            ' They are a monitored species in YNP.';
        birdheader = 'Ospreys - Pandion Haliaetus';
        birddisplay = 'block'
        birdimage='images/bird18.jpg'
    }
    else if (birdcheck == 'Falco peregrinus'){
        filterBird = ['==', ['get', 'species'], 'Falco peregrinus'];
        birdtext= 'The Peregrine Falcon can fly up to 200 mph at heights over half a mile.'+
            ' They are a monitored species in YNP.';
        birdheader = 'Peregrine Falcons - Falco Peregrinus';
        birddisplay = 'block'
        birdimage='images/bird19.jpg'
    }
    else if (birdcheck == 'Pelecanus erythrorhynchos'){
        filterBird = ['==', ['get', 'species'], 'Pelecanus erythrorhynchos'];
        birdtext= 'A member of the Pelecanidae family, they are ground nesters that live near lakes and ponds.'+
            ' They are a breeding and monitored species in the park.';
        birdheader = 'American White Pelican - Pelecanus Erythrorhynchos';
        birddisplay = 'block'
        birdimage='images/bird20.jpg'
    }
    else if (birdcheck == 'Larus californicus'){
        filterBird = ['==', ['get', 'species'], 'Larus californicus'];
        birdtext= 'You may see this species play with sticks by picking them up and dropping them again!'+
            ' A rarely sighted bird in YNP, they are a monitored species in the park.';
        birdheader = 'California Gulls - Larus Californicus';
        birddisplay = 'block'
        birdimage='images/bird21.jpg'
    }

    // set the popup image, header, text, display
    changeImage.src = birdimage
    changeHeader.textContent = birdheader;
    changeText.textContent = birdtext;
    infobox.style.display = birddisplay;

    map.setFilter(
        'eagle-point',
        ['all', filterYear, filterSeason, filterBird]
    )
    });

});
