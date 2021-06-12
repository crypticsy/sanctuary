// Genetic Algorithm, Evolving Shakespeare
//
// Demonstration of using a genetic algorithm to perform a search
//
// setup()
//  # Step 1: The Population
//    # Create an empty population (an array or ArrayList)
//    # Fill it with DNA encoded objects (pick random values to start)
//
// draw()
//
//  # Step 1: Selection
//    # Create an empty mating pool (an empty ArrayList)
//    # For every member of the population, evaluate its fitness based on some criteria / function,
//      and add it to the mating pool in a manner consistant with its fitness, i.e. the more fit it
//      is the more times it appears in the mating pool, in order to be more likely picked for reproduction.
//
//  # Step 2: Reproduction Create a new empty population
//    # Fill the new population by executing the following steps:
//       1. Pick two "parent" objects from the mating pool.
//       2. Crossover -- create a "child" object by mating these two parents.
//       3. Mutation -- mutate the child's DNA based on a given probability.
//       4. Add the child object to the new population.
//    # Replace the old population with the new population
//
//   # Rinse and repeat



let target;
let popmax;
let mutationRate;
let population;

let bestPhrase;
let allPhrases;
let stats;

let runButton;



function setup() {

    var width = window.innerWidth * 0.5;
    var height = window.innerHeight;

    createCanvas(width, height);

    bestPhrase = createP("Best phrase:");
    bestPhrase.position(width*1.1,height*0.09);
    bestPhrase.class("best");

    allPhrases = createP("All phrases:");
    allPhrases.position(width*1.55,height*0.09)
    allPhrases.class("all");

    stats = createP("Stats");
    stats.position(width*1.1,height*0.3);
    stats.class("stats");


    target = sessionStorage.getItem('phrase');
    if (target == null){
        target=document.getElementById("target").value;
    } else{
        document.getElementById("target").value = target;
    }

    popmax = sessionStorage.getItem('popmax');
    if (popmax == null){
        popmax=document.getElementById("population").value;
    } else{
        document.getElementById("population").value = popmax;
    }

    mutationRate = sessionStorage.getItem('mutationRate');
    if (mutationRate == null){
        mutationRate=parseInt(document.getElementById("mRate").value)/100;
    } else{
        document.getElementById("mRate").value = parseInt(mutationRate*100).toString();
    }

    console.log(target, popmax, mutationRate);

    // Create a population with a target phrase, mutation rate, and population max
    population = new Population(target, mutationRate, popmax);

}



function draw() {

    population.naturalSelection();                // Generate mating pool
    population.generate();                        // Create next generation
    population.calcFitness();                     // Calculate fitness
    population.evaluate();

    // If we found the target phrase, stop
    if (population.isFinished()) {
        //println(millis()/1000.0);
        noLoop();
    }

    displayInfo();
    background(0);

}



function displayInfo() {

    // Display current status of population
    let answer = population.getBest();

    bestPhrase.html("<span class='canvas_title'>Best Phrase:</span><br>" + answer);

    let statstext = "<span class='canvas_sub_title'>Total Generations:</span>     " + population.getGenerations() + "<br>";
    statstext += "<span class='canvas_sub_title'>Average Fitness:</span>       " + parseFloat(nf(population.getAverageFitness())).toFixed(5) + "<br>";
    statstext += "<span class='canvas_sub_title'>Total Population:</span>      " + popmax + "<br>";
    statstext += "<span class='canvas_sub_title'>Mutation Rate:</span>         " + floor(mutationRate * 100) + "%";

    stats.html(statstext);

    allPhrases.html("<span class='canvas_title'>All phrases:</span><br>" + population.allPhrases());

}



function saveInput(){

    sessionStorage.setItem('phrase', document.getElementById("target").value);
    sessionStorage.setItem('popmax', document.getElementById("population").value);
    sessionStorage.setItem('mutationRate', parseInt(document.getElementById("mRate").value)/100);

}