let circles = [];
let img;
let target;
let mx, my;

function preload() {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    if (url == null) {
        img = loadImage("./assets/monalisa.jpg")
    } else {
        const cap = document.getElementsByClassName("cap")[0]
        const p = document.createElement("p");
        const a = document.createElement("a");
        p.innerHTML = "The image on the right is generated using circle packing of ";
        a.innerHTML = "this image";
        a.href = url;
        a.target = "#";
        p.appendChild(a);
        p.innerHTML += ".";
        p.id = "caption";
        cap.removeChild(cap.lastChild);
        cap.appendChild(p);
        img = loadImage(url);
    }
}

// Save File Function
function saveFile() {
    save('circlepacking.png');
}

function isValidHttpUrl(string) {
    let url;
    
    try {
      url = new URL(string);
    } catch (a) {
        console.log(a);
      return false;  
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

function redirect() {
    const url = document.getElementById("url").value;
    console.log(url);
    if (isValidHttpUrl(url)) {
        document.location.search = "?url="+url;
    } else {
        alert("Enter a valid URL.");
    }
}

function setup() {
    // Responsive canvas sizing
    var isMobile = window.innerWidth < 768;
    var width = isMobile ? window.innerWidth : window.innerWidth * 0.5;
    var height = isMobile ? window.innerHeight * 0.5 : window.innerHeight;

    mx = width / img.width;
    my = height / img.height;
    var canvas = createCanvas(width, height);
    canvas.parent('canvas-container');

    img.loadPixels();

}

function windowResized() {
    var isMobile = window.innerWidth < 768;
    var width = isMobile ? window.innerWidth : window.innerWidth * 0.5;
    var height = isMobile ? window.innerHeight * 0.5 : window.innerHeight;
    resizeCanvas(width, height);
    mx = width / img.width;
    my = height / img.height;
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
    
    var x = random(img.width);
    var y = random(img.height);
    var valid = true;

    circles.forEach(function (c) {
        var d = dist(x*mx, y*my, c.x, c.y);
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
        return new Circle(x*mx, y*my, x, y, c);
    }else{
        return null;
    }
    
}