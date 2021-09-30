// Symmetry corresponding to the number of reflections. Change the number for different number of reflections 
let symmetry = 6;   
let angle = 360 / symmetry;
let bg = 127;

function setup() { 
    var width = window.innerWidth * 0.5;
    var height = window.innerHeight;

    createCanvas(width, height);

    angleMode(DEGREES);
    background(bg);

}

// Save File Function
function saveFile() {
    save('kaliedoscope.png');
}

// Clear Screen function
function clearScreen() {
    let bg = document.getElementById('bg_color').value;
    background(bg);
}

function draw() {
    translate(width / 2, height / 2);

    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let mx = mouseX - width / 2;
        let my = mouseY - height / 2;
        let pmx = pmouseX - width / 2;
        let pmy = pmouseY - height / 2;

        if (mouseIsPressed) {
            symmetry = document.getElementById('symmetry_slider').value;
            angle = 360 / symmetry;
            for (let i = 0; i < symmetry; i++) {
                rotate(angle);
                let sw = document.getElementById('brush_slider').value;
                stroke(document.getElementById('brush_color').value);
                strokeWeight(sw);
                line(mx, my, pmx, pmy);
                push();
                scale(1, -1);
                line(mx, my, pmx, pmy);
                pop();
            }
        }
    }
}
