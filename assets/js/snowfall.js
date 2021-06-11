let snowCollection = [];                // array to store all the snow
let canvas, ctx;                        // cavnas = canvas element, ctx = 2d context of the canvas
let numberOfSnow;                       //number of snows to show
let fps = 30;                           //the frames per second to render the animation



/*
    ctx methods:
    fillRect(x,y,w,h): makes a rectangle from top-left corner at x,y with width and height w ,h.
    fillStyle(color): sets the color with which everything is filled.
*/

// class for each snow object
class Snow {
    
    static gravity = 0.5;               // static class variable gravity is same for all particles
    
    Snow() {
        // initialize every class variable to 0 in the constructor
        this.x = 0, this.y = 0;         // x and y are the co-ordinates of this snow
        this.n = 0;                     // number to show 0 or 1
        this.size = 0;                  // this size of the snow
        this.yVel = 0;                  // the yVel of the snow
        this.rotateDir = 0;             // the direction to rotate the snow
        this.angle = 0;                 // the current angle of the snow
        this.opacity = 0;
        this.color = "";
    }

    // method to set all the values of snow to randomized positions
    resetRandom() {
        this.x = getRandom(0, canvas.width);
        this.y = 0;

        this.n = Math.floor(getRandom(0, 2));               // floor to the lower bound for integer values

        this.dir = (getRandom(0, 1)) < 0.5 ? 1 : -1;        // (ternary operator) if random value < 0.5 dir = 1, else dir = -1
        this.angle = getRandom(0, 360);
        this.size = Math.floor(getRandom(1, 15));
        this.opacity = getRandom(0.05, 0.2);                   // the opacity of the particle
        this.yVel = Snow.gravity * this.size;               //the yVel is influenced by the size of the snow
        this.color = "#6d6e70"

    }

    // this method sets the value of this.y to a random value in the screen.
    randomizeY() {
        this.y = getRandom(0, canvas.height);
    }

    // this method updates the snow's current position by one step/frame.
    update() {

        //if snow is out of position reset it back to top
        if (this.y > canvas.height) {
            this.resetRandom();
        }

        //make the snow fall while rotating
        this.y += this.yVel;
        this.angle += this.dir * this.yVel;
    }

    // this method is used to actually draw the snow to the canvas
    drawSnow() {
        ctx.font = this.size + "px Arial";
        ctx.fillStyle = this.color;                     // alpha = this.opacity
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(getRadian(this.angle));
        ctx.fillText(this.n, 0, 0);
        ctx.restore();
    }

}



// this method makes sure that the canvas is always on the background 
// without this method, if the user scrolls past a certain point, the actual white background will be revealed
window.onscroll = function() {
    resizeCanvas();
}



// load the canvas once the page has loaded, else: document.getElementById("binary-snow") returns null
window.onload = function() {

    // initialize all global variables and the variables for the canvas
    canvas = document.getElementById("binary-snow");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    numberOfSnow = Math.floor(Math.min((canvas.width * canvas.height)/8000, 100));

    // get the 2d context of the canvas
    ctx = canvas.getContext("2d");

    clearCanvas();

    initializeSnows();

    // make snow fall down based upon the FPS: frames per second.
    setInterval(makeSnowFall, 1000 / fps);              // 1 sec = time * fps, 1 sec = 1000 ms
}



// make the canvas translate to where the scrollbar is at.
function resizeCanvas() {
    document.getElementById("binary-snow").style.top = window.scrollY + "px";
}



// clears the canvas by drawing a rect over everything
function clearCanvas() {
    ctx.fillStyle = "#212121";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}



// updates the values for each snow in the snowCollection and draws them on the canvas.
function makeSnowFall() {
    clearCanvas();                                  // clearing the canvas before drawing again
    snowCollection.forEach(s => {
        s.update();
        s.drawSnow();
    });
}



// this method initializes the snowCollection variable for the first time when the page is loaded.
function initializeSnows() {

    // loop numberOfSnow times
    for (let i = 0; i < numberOfSnow; i++) {
        let s = new Snow();
        s.resetRandom();
        s.randomizeY();
        snowCollection.push(s);
    }
}



// this method return a random value between the ranges: min(inclusive) and max(exclusive)
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}



// this method converts the degree measure of an angle to radian measure.
function getRadian(deg) {
    return deg * Math.PI / 180;
}
