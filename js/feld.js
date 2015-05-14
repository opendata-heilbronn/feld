/* globals VIZI: false, Q: false, _: false, THREE: false, d3: false, geoJSONArea: false, $: false,
          TWEEN: false */
'use strict';

// (function(){
VIZI.ENABLE_OUTLINES = false;
VIZI.ENABLE_ROADS = true;

VIZI.DEBUG = false;
function THF(){
    VIZI.City.call(this);
}
THF.prototype = new VIZI.City();
THF.prototype.constructor = VIZI.City;

THF.prototype.init = function(options) {
  VIZI.Log('Loading city');

  var startTime = Date.now();
  var self = this;

  var deferred = Q.defer();

  if (!options) {
    options = {};
  }

  this.options = options;

  var hash = window.location.hash.replace('#', '');
  var coordCheck = /^(\-?\d+(\.\d+)?),(\-?\d+(\.\d+)?)$/;
  if (coordCheck.test(hash)) {
    options.coords = hash.split(',').reverse();
  }

  _.defaults(options, {
    coords: [-0.01924, 51.50358],
    capZoom: true,
    capOrbit: true,
    overpass: true,
    overpassGridUpdate: true,
    overpassWayIntersect: false,
    controls: { enable: true }
  });

  // Output city options
  VIZI.Log(options);

  // Set up geo methods
  self.geo = VIZI.Geo.getInstance({
    center: options.coords
  });

  // Load city using promises

  self.publish('loadingProgress', 0);

  // Initialise loading UI
  this.initLoadingUI().then(function() {
    self.publish('loadingProgress', 0.1);

    // Initialise debug tools
    return self.initDebug();
  }).then(function() {
    self.publish('loadingProgress', 0.2);

    // Initialise WebGL
    return self.initWebGL(options);
  // }).then(function() {
  //   self.publish('loadingProgress', 0.25);

  //   // Initialise attribution UI
  //   return self.initAttributionUI();
  }).then(function() {
    self.publish('loadingProgress', 0.3);

    var promises = [];

    // Initialise DOM events
    promises.push(self.initDOMEvents());

    // Initialise controls
    promises.push(self.initControls());

    return Q.allSettled(promises);
  }).then(function() {
    self.publish('loadingProgress', 0.4);

    // Initialise grid manager
    return self.initGrid();
  }).then(function() {
    self.publish('loadingProgress', 0.5);

    // TODO: Work out a way to use progress event of each promises to increment loading progress
    // Perhaps by looping through each promises individually and working out progress fraction by num. of promises / amount processed

    // Load objects using promises
    var promises = [];

    // Load core city objects
    promises.push(self.loadCoreObjects());

    // Load data from the OSM Overpass API
    if (options.overpass) {
      self.data = new VIZI.DataOverpassCustom({
        gridUpdate: options.overpassGridUpdate
      });
      promises.push(self.loadOverpass(options.overpassWayIntersect));
    }

    return Q.allSettled(promises);
  }).then(function () {
    // Set up and start application loop
    self.loop = new VIZI.Loop();

    self.publish('loadingProgress', 1);
    self.publish('loadingComplete');

    VIZI.Log('Finished loading city in ' + (Date.now() - startTime) + 'ms');

    deferred.resolve();
  }).fail(function(error){
    throw error;
  });

  return deferred.promise;
};


var city = new THF();

var cameraOptions = {"capZoom":true,"capOrbit":true,"orbitCapLow":65,"orbitCapHigh":175,"coords":[9.22, 49.15],"overpassGridUpdate":true,"overpassWayIntersect":false,"controls":{"enable":true},"target":[860.3848352080889,440.04424654556533],"cameraRadius":7349,"theta":7,"phi":154,"zoomCapLow":250,"zoomCapHigh":2000,"cameraFov":40,"near":2,"far":40000};

var wayPoints = {
  overview: {
    cameraOptions: _.clone(cameraOptions)
  },
  tempelhoferdamm: {
    cameraOptions: {
      "capZoom":true,"capOrbit":true,"orbitCapLow":65,"orbitCapHigh":175,"coords":[9.22336, 49.15654],"overpassGridUpdate":true,"overpassWayIntersect":false,"controls":{"enable":true},"target":[-1470.438942166035,716.3654002568528],"cameraRadius":1996,"theta":252,"phi":91,"zoomCapLow":250,"zoomCapHigh":2000,"cameraFov":40,"near":2,"far":40000
    }
  },
  oderstrasse: {
    cameraOptions: {
      "capZoom":true,"capOrbit":true,"orbitCapLow":65,"orbitCapHigh":175,"coords":[13.398342,52.476684],"overpassGridUpdate":true,"overpassWayIntersect":false,"controls":{"enable":true},"target":[2496.4731570779963,649.1202353895497],"cameraRadius":2000,"theta":78,"phi":65,"zoomCapLow":250,"zoomCapHigh":2000,"cameraFov":40,"near":2,"far":40000
    }
  },
  suedring: {
    cameraOptions: {
      "capZoom":true,"capOrbit":true,"orbitCapLow":65,"orbitCapHigh":175,"coords":[13.398342,52.476684],"overpassGridUpdate":true,"overpassWayIntersect":false,"controls":{"enable":true},"target":[388.9192562717134,2240.285129070899],"cameraRadius":2722,"theta":294.5,"phi":79,"zoomCapLow":250,"zoomCapHigh":2000,"cameraFov":40,"near":2,"far":40000
    }
  }
};

var triggerTween = function(city, wayPoint){
  console.log('start tween');
  var options = city.webgl.camera.serialize();
  var current = {theta: options.theta, phi: options.phi, target0: options.target[0], target1: options.target[1], cameraRadius: options.cameraRadius};
  var next = wayPoints[wayPoint].cameraOptions;
  var target = {theta: next.theta, phi: next.phi, target0: next.target[0], target1: next.target[1], cameraRadius: next.cameraRadius};
  var tween = new TWEEN.Tween(current).to(target, 5000).easing(TWEEN.Easing.Bounce.InOut).delay(1500);//.easing(TWEEN.Easing.Sinusoidal.EaseInOut);
  tween.onUpdate(function(){
    console.log('tween', this);
    options.target = [this.target0, this.target1];
    options.phi = this.phi;
    options.theta = this.theta;
    options.cameraRadius = this.cameraRadius;
    city.webgl.camera.load(options);
  });
  tween.start();
};

$('.section').hide();

$('.nav a').click(function(e){
  e.preventDefault();
  var action = $(this).attr('href').substring(1);
  if (wayPoints[action] !== undefined) {
    triggerTween(city, action);
  }
  $('.nav li').removeClass('active');
  $(this).parent().addClass('active');
  $('.section').hide();
  $('#' + action).show();
});

function animate() {

    requestAnimationFrame( animate ); // js/RequestAnimationFrame.js needs to be included too.
    TWEEN.update();

}

animate();

city.init({
  container: $('.webgl-container')[0],
  camera: cameraOptions,
  // coords: [-0.01924, 51.50358] // Canary Wharf
  // coords: [13.381320, 52.498460] // Tempelhofer Ufer 23
  coords: [9.22, 49.15] // Tempelhofer Feld
  // coords: [-0.1159894466, 51.5045487479] // London Eye
  // coords: [-73.984762, 40.7516199] // NYC (performance-heavy)
}).then(function(){
  // city.subscribe("update", function(){
  //   TWEEN.update();
  // });
  // var floorContainer = new THREE.Object3D();
  city.webgl.camera.load(cameraOptions);
  // var floorWireGeom = new THREE.PlaneGeometry(5000, 5000, 200, 200);
  // var floorWireMat = new THREE.MeshBasicMaterial({color: 0xeeeeee, wireframe: true});
  // var floorWire = new THREE.Mesh(floorWireGeom, floorWireMat);
  // floorWire.position.y = -0.3;
  // floorWire.rotation.x = - 90 * Math.PI / 180;

  // floorContainer.add(floorWire);

  // var floorGeom = new THREE.PlaneGeometry(40000, 40000, 4, 4);
  // var floorGeom = new THREE.CubeGeometry(50, 50, 50);
  // var floorMat = new THREE.MeshBasicMaterial({color: 0xff0000});
  // var floor = new THREE.Mesh(floorGeom, floorMat);
  // var geo = VIZI.Geo.getInstance();

  // var blue = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors,
  //     ambient: 0x0000ff,
  //     color: 0x0000ff,
  // });
  // var skyboxMesh = new THREE.Mesh( new THREE.CubeGeometry( 100000, 100000, 100000, 1, 1, 1, null, true ), blue);
  // // add it to the scene
  // city.publish('addToScene', skyboxMesh);

  // var cube = new THREE.Mesh(new THREE.CubeGeometry(50, 50, 50), new THREE.MeshLambertMaterial({color: 0xCC0000}));
  // cube.position.y = 15;
  // cube.castShadow = true;
  // city.publish('addToScene', cube);

   var buildings = [], features = [];
  var ensemble = [];

  $('#new-buildings').change(function(){
    if ($(this).prop('checked')) {
       //aufrufende Instanz:
      console.log("Trigger-aufrufende Instanz: "+this);
      var material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors,
        //mit dieser Farbkombi lässt sich ein Unterschied zu den Blau-Farben erkennen ....
       ambient: 0xa9bbd6,
       color: 0xFF0000 
      })
      _.each(features, function(feature){
        var obj = createExtrudedObject({
          coordinates: feature.geometry.coordinates,
          properties: _.defaults(feature.properties, {
            roof: {}
          })
        }, city.geo, material);
        buildings.push(obj);
        city.publish('addToScene', obj);
      });
    } else {
      _.each(buildings, function(obj){
        city.publish('removeFromScene', obj);
      });
      buildings = [];
    }
  });

  function go(dummy){
    var uses = ['Suedschenkel', 'Westschenkel'];
    var colours = ['0xeeeeee',"0xa9bbd6"]
  //  console.log(uses[1]);
  //  console.log(colours[1]);


    for (var i = 0; i < uses.length; i++) {
      if (dummy === uses[i]){
    //    console.log(i);
    // colours =  colours[i]
         // Besser mit Hash oder Doppelarray?! 
 /*   if (dummy) {
      console.log(dummy+ " kommt in Funktion an")
    };
    */
      //aufrufende Instanz:
      console.log("Funktion-aufrufende Instanz: "+this);
  //     var material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors})
     
      var color = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors,
       ambient: 0x222222,
       color: colours[i]
      }); 
      _.each(features, function(feature){
        var obj = createExtrudedObject({
          coordinates: feature.geometry.coordinates,
          properties: _.defaults(feature.properties, {
            roof: {}
          })
        }, city.geo, color);
        console.log(obj);
        buildings.push(obj);
        city.publish('addToScene', obj);
      });
     
 /*   else {
      _.each(buildings, function(obj){
        city.publish('removeFromScene', obj);
      });
      buildings = [];
    } */
      }
    };
  }

//  $('#new-buildings').change(go(0));

  $.getJSON('buildings.geojson', function(geojson){
    var ensemble;
    _.each(geojson.features, function(feature){
      ensemble = feature.properties.ensemble;  
  
        feature.properties.area = feature.properties.area || geoJSONArea(feature.geometry);
        // city.data.processArea(feature.geometry.coordinates[0]);
        if (!feature.properties.height) {
          if (feature.properties.maxfloors) {
            feature.properties.height = feature.properties.maxfloors * 3.14;
          } else {
            feature.properties.height = 22;
          }
        }
        // console.log(feature.properties);
        features.push(feature);
        if (ensemble){
          go(ensemble);
        }
        else {
          $('#new-buildings').prop('checked', true).change();
        }
//die (nicht sichtbare) Control 'Zeige Gebäude' wird ANgehakt

    
    });
  });
});
// }());