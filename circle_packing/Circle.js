class Circle{
    
    constructor(x, y, sx, sy, c) {
        this.sx = sx;
        this.sy = sy;
        this.x = x;
        this.y = y;
        this.r = 1;
        this.color = c;

        this.growing = true;
    }

    grow(){
        if (this.growing){
            this.r++;
        }
    }

    edges(){
        return ( 
            this.x + this.r > width || 
            this.x - this.r < 1 || 
            this.y + this.r > height || 
            this.y - this.r < 1 )
    }

    show(){
        noStroke();
        fill(this.color);
        ellipse(this.x, this.y, this.r*2, this.r*2);
    }


}