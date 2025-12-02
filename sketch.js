// --- GLOBAL STATE ---
let tears = []; // Array to hold all active Tear objects
let collageImages = []; // Array to hold all persistent collage images

let isCrying = false;
let startTime = 0;
let emissionRate = 3; // Emit a tear every 3 frames (approx. 20 tears/sec)

// --- CONFIGURATION ---
// IMPORTANT: REPLACE THESE STRINGS WITH THE EXACT NAMES OF YOUR FILES!
const TEAR_FILENAMES_A = ['tear1.png', 'tear2.png', 'tear3.png']; 
const TEAR_FILENAMES_B = ['tear4.png', 'tear5.png', 'tear6.png']; 
const SLIDESHOW_FILENAMES = [
    'slide1.jpg', 'slide2.jpg', 'slide3.jpg', 
    'slide4.jpg', 'slide5.jpg', 'slide6.png'
];
const SLIDE_DURATION = 3000; // 3 seconds

let tearImagesSetA = [];
let tearImagesSetB = [];
let slideshowImages = [];
let activeTearSet;
let slideshowInterval = null;

// --- PRELOAD: Load all images before the program starts ---
function preload() {
    // 1. Load Tear Sets
    for (let file of TEAR_FILENAMES_A) {
        tearImagesSetA.push(loadImage(file));
    }
    for (let file of TEAR_FILENAMES_B) {
        tearImagesSetB.push(loadImage(file));
    }
    // 2. Load Slideshow Images
    for (let file of SLIDESHOW_FILENAMES) {
        slideshowImages.push(loadImage(file));
    }
    
    activeTearSet = tearImagesSetA; // Start with Set A
}

// --- SETUP: Runs once when the program starts ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    imageMode(CENTER);
    noStroke();
    // Color mode is set to RGB for image display
    colorMode(RGB, 255, 255, 255, 255); 
}

// --- TEAR OBJECT CLASS (PHYSICS) ---

class Tear {
    constructor(x, y, activeSet) {
        // --- State Variables ---
        this.x = x;
        this.y = y;
        this.size = random(160, 260); // EXAGGERATED SIZE
        this.lifespan = 2.5 * 60; // Reduced to 2.5 seconds for better performance
        this.life = this.lifespan;
        
        // --- Physics Variables ---
        this.vx = random(-1.5, 1.5); 
        this.vy = random(-2, 0); 
        this.ay = 0.5; // Gravity
        
        // --- Visuals ---
        this.img = random(activeSet); // Selects a random loaded p5.Image object
    }

    update() {
        // Apply Gravity
        this.vy += this.ay; 
        
        // Apply Movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Reduce lifespan
        this.life--;
    }

    display() {
        // Calculate opacity and scale based on remaining life
        let alpha = map(this.life, 0, this.lifespan, 0, 255); 
        let scaleFactor = map(this.life, 0, this.lifespan, 0.1, 1); 

        push(); 
        translate(this.x, this.y);
        
        // --- FIX: Keep Original Color (Only apply opacity) ---
        tint(255, alpha); // Apply full R, G, B color, only reducing alpha (opacity)

        // Draw the image onto the canvas
        image(this.img, 0, 0, this.size * scaleFactor, this.size * scaleFactor);
        
        pop(); 
    }
}

// --- SLIDESHOW IMAGE OBJECT (PERSISTENT COLLAGE) ---

class CollageImage {
    constructor(img) {
        this.img = img;
        this.opacity = 0;
        this.scale = random(0.6, 1.0);
        this.x = random(width * 0.1, width * 0.9);
        this.y = random(height * 0.1, height * 0.9);
        this.rotation = 0; // Fixed angle
    }
    
    update() {
        // Slowly fade in
        if (this.opacity < 255) {
            this.opacity += 5;
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        
        // Opacity control
        tint(255, this.opacity);
        
        // Draw the collage image
        image(this.img, 0, 0, this.img.width * this.scale, this.img.height * this.scale);
        
        pop();
    }
}

// --- MAIN GAME LOOP (Draws everything 60 times per second) ---

function draw() {
    // 1. Clear Canvas (Draw white background)
    background(255); 
    
    // 2. Handle Tear Emission
    if (isCrying) {
        // Drop a new tear every 10 frames (for density)
        if (frameCount % 10 === 0) {
            tears.push(new Tear(mouseX, mouseY, activeTearSet));
        }
    }
    
    // 3. Update & Draw Collage Images (Draws underneath tears)
    for (let img of collageImages) {
        img.update();
        img.display();
    }
    
    // 4. Physics Update & Drawing (Tears)
    
    for (let i = tears.length - 1; i >= 0; i--) {
        let tear = tears[i];
        
        // Run physics and update position
        tear.update(); 
        
        // Draw the tear
        tear.display();
        
        // Check Lifespan (Removal)
        if (tear.life <= 0) {
            tears.splice(i, 1); // Remove tear from array
        }
    }
    
    // IMPORTANT PERFORMANCE ADJUSTMENT:
    // If the frame rate drops below 30, increase the emission rate to save CPU
    if (frameRate() < 30) {
        emissionRate = 20; // Drastically reduce tear output if lagging
    } else {
        emissionRate = 3; // Use the high density rate if stable
    }
}

// --- UTILITY AND INTERACTION FUNCTIONS ---

// Function to toggle the active tear set
function toggleTearSet() {
    activeTearSet = (activeTearSet === tearImagesSetA) ? tearImagesSetB : tearImagesSetA;
}

// Slideshow/Collage Logic
function createCollageImage() {
    let img = random(slideshowImages);
    collageImages.push(new CollageImage(img));
}

function startSlideshow() {
    if (slideshowInterval === null) {
        createCollageImage(); 
        slideshowInterval = setInterval(createCollageImage, SLIDE_DURATION); 
    }
}

function stopSlideshow() {
    if (slideshowInterval !== null) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
        // Fade out all currently visible images
        collageImages = []; 
    }
}

// Sets crying flag and starts timer
function startCrying() {
    if (!isCrying) {
        isCrying = true;
        startTime = millis(); 
    }
}

// Resets crying flag
function stopCrying() {
    if (isCrying) {
        isCrying = false;
    }
}

// Handles resizing
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// --- INPUTS ---

// Desktop mouse events
function mousePressed() {
    startCrying();
    return false; // Prevent default browser action
}
function mouseReleased() {
    stopCrying();
    return false; 
}

// Mobile touch events 
function touchStarted() {
    startCrying();
    return false;
}
function touchEnded() {
    stopCrying();
    return false;
}

// Key events for Spacebar, S, and T
function keyPressed() {
    if (key === ' ' && !isCrying) {
        startCrying();
    } else if (key === 's') {
        // Toggle Slideshow
        (slideshowInterval === null) ? startSlideshow() : stopSlideshow();
    } else if (key === 't') {
        // Toggle Tear Set
        toggleTearSet();
    }
}

function keyReleased() {
    if (key === ' ' && isCrying) {
        stopCrying();
    }
}
