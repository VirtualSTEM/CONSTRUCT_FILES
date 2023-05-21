/**
 This game is a basic platformer game.
 The design assets were obtained from:
 https://www.kenney.nl/assets/abstract-platformer
 
 Here, we define the variables used in our game.
 We don't initialize the variables with a value yet.
 **/
let playerBox;
let playerAnim;
let enemies;
let pickups;
let edgeMarkers;
let keyboard;
let scoreText;
let livesText;
let score;
let lives;

runOnStartup(async runtime => {
    // Code to run on the loading screen.  Layouts, objects etc. are not yet available.
    runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime) {
    // Code to run just before 'On start of layout' on
    // the first layout. Loading has finished and initial
    // instances are created and available to use here.

    // Here, we initialize the variables defined above
    playerBox = runtime.objects.PlayerBox.getFirstInstance();
    playerAnim = runtime.objects.PlayerAnim.getFirstInstance();
    enemies = runtime.objects.Enemy.getAllInstances();
    pickups = runtime.objects.Pickup.getAllInstances();
    edgeMarkers = runtime.objects.EdgeMarker.getAllInstances();
    keyboard = runtime.keyboard;
    scoreText = runtime.objects.TextScore.getFirstInstance();
    livesText = runtime.objects.TextLives.getFirstInstance();
    score = 0;
    lives = 3;

    runtime.addEventListener("tick", () => tick(runtime));
}

/**
 The tick() function runs 60 times per second while the game is running.
 **/
function tick(runtime) {
    scoreText.text = "Score: " + score;
    livesText.text = "Lives: " + lives;
    getInputsAndMove();
    checkForCollisions(runtime);
    checkFall();
    moveEnemies();
}

// Called on every Tick.  Moves player (and sets player animation) in response to keyboard input.
function getInputsAndMove() {

    // Set the PlayerBox and PlayerAnim to the same location
    playerAnim.setPosition(playerBox.x, playerBox.y);

    // Right
    if (keyboard.isKeyDown("ArrowRight")) {
        playerBox.behaviors.Platform.simulateControl("right");
        playerAnim.setAnimation("walkRight");
    }

    // Left
    else if (keyboard.isKeyDown("ArrowLeft")) {
        playerBox.behaviors.Platform.simulateControl("left");
        playerAnim.setAnimation("walkLeft");
    }

    // Up
    else if (keyboard.isKeyDown("Space")) {
        playerBox.behaviors.Platform.simulateControl("jump");
        playerAnim.setAnimation("jump");
    } else {
        playerAnim.setAnimation("idle");
    }

}

// Called on every Tick to check for collisions Enemy-EdgeMarker, Enemy-PlayerBox, PlayerBox-Pickup.
function checkForCollisions(runtime) {

    for (const pickup of pickups) {
        if (playerBox.testOverlap(pickup)) {
            pickup.destroy();
            score += 10; // equivalent to score = score + 10;
        }
    }
    // Some pickups may have been destroyed. Re-populate the pickups array.
    pickups = runtime.objects.Pickup.getAllInstances();

    for (const enemy of enemies) {
        // Check if the PlayerBox is touching any of the enemies
        if (playerBox.testOverlap(enemy)) {
            // Add a Flash Behavior to the PlayerAnim if touching .flash(onTime, offTime, duration)
            playerAnim.behaviors.Flash.flash(0.1, 0.1, 1.0);
        }
        for (const edgeMarker of edgeMarkers) {
            if (enemy.testOverlap(edgeMarker)) {
                // bounce the enemy off of the edgeMarker so this loop runs only once.
                // If the enemy is moving right, bounceValue is negative and vice versa.
                const bounceValue = (enemy.instVars.Action === "right") ? -10 : 10;
                enemy.instVars.Action = (enemy.instVars.Action === "right") ? "left" : "right";
                enemy.x += bounceValue;
                break;
            }
        }
    }
}

// Called on every Tick to check if the PlayerBox is falling.  If so, set the PlayerAnim to "fall"
function checkFall() {
    if (playerBox.behaviors.Platform.isFalling) {
        playerAnim.setAnimation("fall");
    }
}

// Called on every Tick to move Enemies between EdgeMarkers. 
function moveEnemies() {
    for (const enemy of enemies) {
        const direction = enemy.instVars.Action;
        enemy.behaviors.Platform.simulateControl(direction);
    }
}