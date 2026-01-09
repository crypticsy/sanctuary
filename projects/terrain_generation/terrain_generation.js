let cols, rows;
let scale = 15;
let flying = 0;
let terrain = [];

var terrain_w;
var terrain_h;

var color1 = {red: 19, green: 173, blue: 19};
var color3 = {red: 255, green: 255, blue: 255};
var color2 = {red: 255, green: 255, blue: 0};


function colorGradient(fadeFraction, rgbColor1, rgbColor2, rgbColor3) {
    var color1 = rgbColor1;
    var color2 = rgbColor2;
    var fade = fadeFraction/150;

    if (rgbColor3) {
      fade = fade *3;

      if (fade >= 1) {
        fade -= 1;
        color1 = rgbColor2;
        color2 = rgbColor3;
      }
    }

    var diffRed = color2.red - color1.red/10;
    var diffGreen = color2.green - color1.green/10;
    var diffBlue = color2.blue - color1.blue;

    var gradient = {
      red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
      green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
      blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
    };

    if (gradient.red < 0 || gradient.green < 0  || gradient.blue  < 0){
        gradient.red = 0;
        gradient.green = 122;
        gradient.blue = 191;
    }

    return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
}



function setup() {
    // Responsive canvas sizing
    var isMobile = window.innerWidth < 768;
    var width = isMobile ? window.innerWidth : window.innerWidth * 0.5;
    var height = isMobile ? window.innerHeight * 0.5 : window.innerHeight;

    terrain_w = width*2;
    terrain_h = height*2.1;

    var canvas = createCanvas(width, height, WEBGL);
    canvas.parent('canvas-container');

    cols = terrain_w / scale;
    rows = terrain_h / scale;

}

function windowResized() {
    var isMobile = window.innerWidth < 768;
    var width = isMobile ? window.innerWidth : window.innerWidth * 0.5;
    var height = isMobile ? window.innerHeight * 0.5 : window.innerHeight;

    terrain_w = width*2;
    terrain_h = height*2.1;

    resizeCanvas(width, height);

    cols = terrain_w / scale;
    rows = terrain_h / scale;
}



function draw(){

    let scale = 40-document.getElementById('population_slider').value;
    let speed = document.getElementById('speed_slider').value/100;
    flying -= speed + (0.4-(scale/100));
    cols = terrain_w / scale;
    rows = terrain_h / scale;

    var yOff=0;
    for(let x = 0; x < cols; x++){
        var xOff = flying;
        terrain[x]=new Array();

        for (let y = 0; y < rows; y++){
            terrain[x].push( map( noise(xOff,yOff), 0, 1, -120, 120) );
            xOff += 0.15;
        }
        yOff += 0.15;

    }

    background("#a1e9ff");
    noStroke();

    rotateX(PI / 3);
    translate(-terrain_w/2, -terrain_h/2);

    for(let y = 0; y < rows-1; y++){
        beginShape(TRIANGLE_STRIP);

        for (let x = 0; x < cols; x++){
            vertex(x * scale, y * scale, terrain[x][y] );
            vertex(x * scale, (y+1) * scale, terrain[x][y+1]);
            fill(colorGradient(terrain[x][y], color1, color2, color3));
        }

        endShape();
    }

}
