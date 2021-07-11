let circles = [];
let img;
let target;

function preload() {
    img = loadImage("./assets/monalisa.jpg");
}
  

function setup() { 
    var width = window.innerWidth * 0.5;
    var height = window.innerHeight;

    createCanvas(width, height);    

    img.loadPixels();
    
}



function draw() {
    
    background(0);

    var count = 0;
    var total = 20;
    var attempts = 0;

    while(count < total){
        c = newCircle();
        if(c != null){
            circles.push(c);
            count++;
        }
        attempts++;
        if(attempts>1000){
            noLoop();
            break;
        }
    }

    circles.forEach(function (c) {
        if(c.growing){
            if (c.edges()){
                c.growing=false;

            }else{
                circles.forEach(function (other) {
                    if(c!=other){
                        var d = dist(c.x, c.y, other.x, other.y);
                        if (d < c.r + other.r){
                            c.growing=false;
                            return;
                        }
                    }
                });

            }
        }

        c.show();
        c.grow();
    });

}




function newCircle(){
    
    var x = random(width);
    var y = random(height);

    var valid = true;

    circles.forEach(function (c) {
        var d = dist(x, y, c.x, c.y);
        if (d < c.r){
            valid=false;
            return;
        }
    });

    if (valid){
        var index = (int(x) + int(y) * img.width) * 4;
        var r = img.pixels[index];
        var g = img.pixels[index + 1];
        var b = img.pixels[index + 2];
        var c = color(r, g, b);
        return new Circle(x, y, c);
    }else{
        return null;
    }
    
}