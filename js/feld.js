/* globals VIZI: false, Q: false, _: false, THREE: false, d3: false, geoJSONArea: false, $: false,
 TWEEN: false */
'use strict';

// (function(){
VIZI.ENABLE_OUTLINES = false;
VIZI.ENABLE_ROADS = true;

VIZI.DEBUG = false;
function THF() {
    VIZI.City.call(this);
}
THF.prototype = new VIZI.City();
THF.prototype.constructor = VIZI.City;

THF.prototype.init = function (options) {
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
        controls: {enable: true}
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
    this.initLoadingUI().then(function () {
        self.publish('loadingProgress', 0.1);

        // Initialise debug tools
        return self.initDebug();
    }).then(function () {
        self.publish('loadingProgress', 0.2);

        // Initialise WebGL
        return self.initWebGL(options);
        // }).then(function() {
        //   self.publish('loadingProgress', 0.25);

        //   // Initialise attribution UI
        //   return self.initAttributionUI();
    }).then(function () {
        self.publish('loadingProgress', 0.3);

        var promises = [];

        // Initialise DOM events
        promises.push(self.initDOMEvents());

        // Initialise controls
        promises.push(self.initControls());

        return Q.allSettled(promises);
    }).then(function () {
        self.publish('loadingProgress', 0.4);

        // Initialise grid manager
        return self.initGrid();
    }).then(function () {
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
    }).fail(function (error) {
        throw error;
    });

    return deferred.promise;
};


var city = new THF();

var cameraOptions = {
    "capZoom": true,
    "capOrbit": true,
    "orbitCapLow": 65,
    "orbitCapHigh": 175,
    "coords": [9.22, 49.15],
    "overpassGridUpdate": true,
    "overpassWayIntersect": false,
    "controls": {"enable": true},
    "target": [860.3848352080889, 440.04424654556533],
    "cameraRadius": 7349,
    "theta": 7,
    "phi": 154,
    "zoomCapLow": 250,
    "zoomCapHigh": 2000,
    "cameraFov": 40,
    "near": 2,
    "far": 40000
};

var wayPoints = {
    overview: {
        cameraOptions: {
            "capZoom": true,
            "capOrbit": true,
            "orbitCapLow": 65,
            "orbitCapHigh": 175,
            "coords": [9.22336, 49.159929],
            "overpassGridUpdate": true,
            "overpassWayIntersect": false,
            "controls": {"enable": true},
            "target": [-1470.438942166035, 716.3654002568528],
            "cameraRadius": 1996,
            "theta": 132,
            "phi": 91,
            "zoomCapLow": 250,
            "zoomCapHigh": 2000,
            "cameraFov": 40,
            "near": 2,
            "far": 40000
        }
    },
    esplanadenschenkel: {
        cameraOptions: {
            "capZoom": true,
            "capOrbit": true,
            "orbitCapLow": 5,
            "orbitCapHigh": 175,
            "coords": [9.207428, 49.144565],
            "overpassGridUpdate": true,
            "overpassWayIntersect": false,
            "controls": {"enable": true},
            "target": [-1470.438942166035, 716.3654002568528],
            "cameraRadius": 600,
            "theta": 10,
            "phi": 30,
            "zoomCapLow": 250,
            "zoomCapHigh": 2000,
            "cameraFov": 40,
            "near": 2,
            "far": 40000
        }
    },
    inselschenkel: {
        cameraOptions: {
            "capZoom": true,
            "capOrbit": true,
            "orbitCapLow": 5,
            "orbitCapHigh": 175,
            "coords": [9.20742115512, 49.14852917309],
            "overpassGridUpdate": true,
            "overpassWayIntersect": false,
            "controls": {"enable": true},
            "target": [-2000, 650],
            "cameraRadius": 600,
            "theta": 350,
            "phi": 30,
            "zoomCapLow": 250,
            "zoomCapHigh": 2000,
            "cameraFov": 40,
            "near": 2,
            "far": 40000
        }
    },
    neckarschenkel: {
        cameraOptions: {
            "capZoom": true,
            "capOrbit": true,
            "orbitCapLow": 5,
            "orbitCapHigh": 175,
            "coords": [9.20954909156642, 49.1472289662952],
            "overpassGridUpdate": true,
            "overpassWayIntersect": false,
            "controls": {"enable": true},
            "target": [-1550, 650],
            "cameraRadius": 600,
            "theta": -125,
            "phi": 65,
            "zoomCapLow": 250,
            "zoomCapHigh": 2000,
            "cameraFov": 40,
            "near": 2,
            "far": 40000
        }
    }
};

setInterval(function() {

    console.log(city);
    console.log("Theta: " + city.webgl.camera.theta, "Phi: " + city.webgl.camera.phi, "Geo: " + city.geo.center);
}, 1000);

var triggerTween = function (city, wayPoint) {
    console.log('start tween');
    var options = city.webgl.camera.serialize();
    var current = {theta: options.theta, phi: options.phi, target0: options.target[0], target1: options.target[1], cameraRadius: options.cameraRadius};
    var next = wayPoints[wayPoint].cameraOptions;
    var target = {theta: next.theta, phi: next.phi, target0: next.target[0], target1: next.target[1], cameraRadius: next.cameraRadius};
    var tween = new TWEEN.Tween(current).to(target, 5000).easing(TWEEN.Easing.Cubic.InOut).delay(500);//.easing(TWEEN.Easing.Sinusoidal.EaseInOut);
    tween.onUpdate(function () {
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

$('.nav a').click(function (e) {
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

    requestAnimationFrame(animate);
    TWEEN.update();

}

animate();

city.init({
    container: $('.webgl-container')[0],
    camera: cameraOptions,
    coords: [9.22, 49.15] // Heilbronn
}).then(function () {
    city.webgl.camera.load(cameraOptions);

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
    var ensemble_colours = {
        'Esplanadenschenkel': 0xBBD8FF,
        'Inselschenkel': 0xCAFFAA, 
        'Neckarschenkel': 0xFFAE85
    }

    $.getJSON('buildings.geojson', function (geojson) {
        var ensemble;
        _.each(geojson.features, function (feature) {
            ensemble = feature.properties.ensemble;

            feature.properties.area = feature.properties.area || geoJSONArea(feature.geometry);
            if (!feature.properties.height) {
                if (feature.properties.maxfloors) {
                    feature.properties.height = feature.properties.maxfloors * 3.14;
                } else {
                    feature.properties.height = 22;
                }
            }

            features.push(feature);

            // draw feature
            var color;
            if(ensemble_colours[feature.properties.ensemble]) {
                color = ensemble_colours[feature.properties.ensemble];
            } else {
                color = 0xFF00FF;
            }

            var material = new THREE.MeshLambertMaterial({
                color: color
            });

            var obj = createExtrudedObject({
                coordinates: feature.geometry.coordinates,
                properties: _.defaults(feature.properties, {
                    roof: {}
                })
            }, city.geo, material);

            buildings.push(obj);
            city.publish('addToScene', obj);
        });
    });
});