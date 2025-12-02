// --- GLOBAL STATE ---
let tears = []; // Array to hold all active Tear objects
let collageImages = []; // Array to hold all persistent collage images

let isCrying = false;
let startTime = 0;
let emissionRate = 3; // Emit a tear every 3 frames (approx. 20 tears/sec)

// --- CONFIGURATION ---
// IMPORTANT: REPLACE THESE STRINGS WITH THE EXACT NAMES OF YOUR FILES!
const TEAR_FILENAMES_A = ['tear1.png', 'tear2.png', 'tear3.png']; 
const TEAR_FILENAMES_B = ['tear6.png', 'tear7.png', 'tear8.png']; 
const SLIDESHOW_FILENAMES = [
    'slide1.jpg'
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
    colorMode(HSL, 360, 100, 100, 255); // Use HSL for color shifting
}

// --- TEAR OBJECT CLASS (PHYSICS) ---

class Tear {
    constructor(x, y, activeSet) {
        // --- State Variables ---
        this.x = x;
        this.y = y;
        this.size = random(160, 260); // EXAGGERATED SIZE
        this.lifespan = 5 * 60; // 5 seconds * 60 frames/sec = 300 frames
        this.life = this.lifespan;
        
        // --- Physics Variables ---
        this.vx = random(-1.5, 1.5); // Stronger initial random horizontal velocity (wind/drift)
        this.vy = random(-2, 0);   // Initial vertical push (tears fall slightly up initially)
        this.ay = 0.5; // Constant vertical acceleration (Gravity)
        
        // --- Visuals ---
        this.img = random(activeSet); // Selects a random image object
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

    display(currentHue) {
        // Calculate opacity and scale based on remaining life
        let alpha = map(this.life, 0, this.lifespan, 0, 255); 
        let scaleFactor = map(this.life, 0, this.lifespan, 0.1, 1); 

        push(); 
        translate(this.x, this.y);
        
        // Apply Hue Filter and Opacity
        // NOTE: Tinting works best on images that are originally grayscale/white.
        let hueValue = (currentHue + this.img.randomOffset) % 360; // Optional offset for image variation
        tint(hueValue, 80, 50, alpha); // Apply the duration-based color and fade

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
        // Drop a new tear every 'emissionRate' frames (for density)
        if (frameCount % emissionRate === 0) {
            tears.push(new Tear(mouseX, mouseY, activeTearSet));
        }
    }
    
    // 3. Update & Draw Collage Images (Draws underneath tears)
    for (let img of collageImages) {
        img.update();
        img.display();
    }
    
    // 4. Physics Update & Drawing (Tears)
    let currentHue = getDurationBasedHue();
    
    for (let i = tears.length - 1; i >= 0; i--) {
        let tear = tears[i];
        
        // Run physics and update position
        tear.update(); 
        
        // Draw the tear with current hue
        tear.display(currentHue);
        
        // Check Lifespan (Removal)
        if (tear.life <= 0) {
            tears.splice(i, 1); // Remove tear from array
        }
    }
}

// --- UTILITY AND INTERACTION FUNCTIONS ---

function getDurationBasedHue() {
    if (!isCrying) return 0;
    
    let duration = (millis() - startTime) / 1000; 
    const hueShiftSpeed = 30; 
    const hue = (duration * hueShiftSpeed) % 360; 
    return hue;
}

// Toggles the active tear set
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
        // Drop a new image every SLIDE_DURATION (3000ms)
        slideshowInterval = setInterval(createCollageImage, SLIDE_DURATION); 
    }
}

function stopSlideshow() {
    if (slideshowInterval !== null) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
        // Fade out all currently visible images
        // We'll just remove them instantly on the canvas for simplicity
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

// Mobile touch events (p5.js simplifies this, treating touch like mouse)
function touchStarted() {
    startCrying();
    return false;
}
function touchEnded() {
    stopCrying();
    return false;
}
// Note: mouseX/Y automatically track finger position

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