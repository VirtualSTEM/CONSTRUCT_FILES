// We need to import the audioManager file from our Scripts directory in Construct
// This file contains additional code we need to play audio files in our code.
import AudioManager from "./audioManager.js";

// VARIABLE DECLARATIONS

// Constant variables (which don't change) are often declared using all UPPER_CASE
const OBSTACLE_X = 1200;
const OBSTACLE_Y = 536;

// Variables whose value will change are declared with the let keyword
// Here, we declare variables, but we don't give them any values yet.
// We give them values in the OnBeforeProjectStart() function below.
let gameOver;
let score;
let numberOfTicks;
let obstacleSpeed;
let leadingZeros;
let player;
let playerBox;
let ground;
let scoreSpriteFont;
let gameOverText;
let obstacles;
let keyboard;

let audioManager = null;
let reachedAudioPlayed = false;

// Audio Files
let hitAudio = null;
let pressAudio = null;
let reachedAudio = null;

/**
This runOnStartup() function call is run automatically by the Construct 3 platform
when the game starts. It tells the program to call the OnBeforeProjectStart() function below
when the "beforeprojectstart" event takes place.
*/
runOnStartup(async runtime => {

    audioManager = new AudioManager(runtime);

    // During the loading screen, load all sound files
    [hitAudio, pressAudio, reachedAudio] = await Promise.all([
        audioManager.loadSound("hit.webm"),
        audioManager.loadSound("press.webm"),
        audioManager.loadSound("reached.webm"),
    ]);

    runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

/**
FUNCTION DEFINITION: OnBeforeProjectStart()
In this function, we initialize (e.g., give values to) the variables we declared above.
The runtime variable is part of Construct 3 and it's how we connect the objects we created 
in the Construct Editor (Player, Obstacle, GameOverText, etc.) to our code.
*/
async function OnBeforeProjectStart(runtime) {
    gameOver = false;
    score = 0;
    numberOfTicks = 0;
    obstacleSpeed = 9;
    leadingZeros = "0000";
    player = runtime.objects.Player.getFirstInstance();
    playerBox = runtime.objects.PlayerBox.getFirstInstance();
    ground = runtime.objects.Ground.getFirstInstance();
    scoreSpriteFont = runtime.objects.ScoreSpriteFont.getFirstInstance();
    gameOverText = runtime.objects.GameOverText.getFirstInstance();
    obstacles = runtime.objects.Obstacle.getAllInstances();
    keyboard = runtime.keyboard;

    // Run the tick() function on every game tick.
    runtime.addEventListener("tick", () => tick(runtime));
}

/*
FUNCTION DEFINITION: tick()
This function runs on each game tick (60 times per second).  If the game is not over, run the
other functions we've defined below.
**/
function tick(runtime) {
    if (!gameOver) {
        numberOfTicks += 1;
        moveGround();
        moveObstacles();
        getInputsAndMove();
        updateScore(runtime);
        spawnObstacles(runtime);
        checkForCollisions();
    }
}

/**
FUNCTION DEFINITION: moveGround()
On every tick, move the Ground Tiled Background by reducing its X value.
*/
function moveGround() {
    // Tiled Background Object Types have the property: imageOffsetX.
    // Reducing the value of this property moves the Tiled Background.
    ground.imageOffsetX -= obstacleSpeed;
}

/**
FUNCTION DEFINITION: moveObstacles()
On every tick, loop through all obstacles and move each by reducing its X value.
*/
function moveObstacles() {
    // for loops allow us to loop through collections or arrays
    for (const obstacle of obstacles) {
        obstacle.x -= obstacleSpeed;
    }
}

/**
FUNCTION DEFINITION: spawnObstacles()
This function spawns an obstacle every 100 ticks.
xOffset is a random integer between 0 and 499.  The X value of the newObstacle is altered by
this amount so that each obstacle doesn't spawn in exactly the same spot.
*/
function spawnObstacles(runtime) {
    const xOffset = Math.floor(Math.random() * 500);
    if (numberOfTicks % 100 == 0) {
        const newObstacle = runtime.objects.Obstacle.createInstance(
            "playerLayer",
            OBSTACLE_X + xOffset,
            OBSTACLE_Y
        );

        // animationPicker is a random value of 1, 2, or 3
        const animationPicker = Math.floor(Math.random() * 3);

        // There are 3 animations on the Obstacle object Type: 0, 1, and 2.
        // Use the empty string: "" to convert the animationPicker number to a string.
        newObstacle.setAnimation("" + animationPicker);

        // There's a new obstacle in the game now, so re-populate the obstacles array
        obstacles = runtime.objects.Obstacle.getAllInstances();

        // When every new obstacle is created, increase the obstacle speed by a little
        // so the game moves faster over time.
        obstacleSpeed += 0.5;
    }
}

/**
FUNCTION DEFINITION: getInputsAndMove()
Called 60 times per second, this function makes the player jump when the space bar is pressed.
It also sets the player animation - "jump" when spacebar is pressed and run when the 
PlayerBox is on the floor.
*/
function getInputsAndMove() {
    // Set the PlayerBox (a rectangle) and Player sprite to the same location
    // This makes it easier for the game to gauge collisions.
    player.setPosition(playerBox.x, playerBox.y);

    if (keyboard.isKeyDown("Space")) {
        playerBox.behaviors.Platform.simulateControl("jump");
        player.setAnimation("jump");
        audioManager.playSound(pressAudio);
    }

    if (playerBox.behaviors.Platform.isOnFloor) {
        player.setAnimation("run");
    }
}

/**
FUNCTION DEFINITION: updateScore()
runtime.dt is the time it takes for 1 tick or 0.0167 seconds
This updateScore() function runs 60 times per second so our score will increase
one point per second.
*/
function updateScore(runtime) {
    // The calculateLeadingZeros() function call here decides how many leading zeros to display.
    calculateLeadingZeros();

    // Increate the score by approximately 0.0167 on every tick
    score += runtime.dt;

    // The Math.floor() function rounds down to a whole number.
    scoreSpriteFont.text = leadingZeros + Math.floor(score);

    // If score is greater than zero and a multiple of 10
    if (Math.floor(score) > 0 && Math.floor(score) % 10 == 0) {
        // Test if reached audio has already played for this score.  If not...
        if (!reachedAudioPlayed) {
            // play the audio and set the reachedAudioPlayed variable to true
            audioManager.playSound(reachedAudio);
            reachedAudioPlayed = true;
        }
    } else {
        // The score is no longer a non-zero multiple of 10.
        // So, set the reachedAudioPlayed variable to false
        reachedAudioPlayed = false;
    }
}

/**
FUNCTION DEFINITION: calculateLeadingZeros();
The displayed score is displayed with leading zeros - zeros as placeholders in the 
tens, hundreds, thousands, and ten thousands position.  This function determines how
many zeros to display depending on the score.
*/
function calculateLeadingZeros() {
    if (score < 10) {
        leadingZeros = "0000";
    } else if (score < 100) {
        leadingZeros = "000";
    } else if (score < 1000) {
        leadingZeros = "00";
    } else if (score < 10000) {
        leadingZeros = "0";
    } else {
        leadingZeros = "";
    }
}

/**
FUNCTION DEFINITION: checkForCollisions();
This function loops through all obstacles and tests if the player is touching them.
If so, we play the hit sound, set the game over variable to true (stopping the functions in the tick() function from running).
Set the gameOverText to visible, and set the player animation to "gameOver".
*/
function checkForCollisions() {
    for (const obstacle of obstacles) {
        if (player.testOverlap(obstacle)) {
            audioManager.playSound(hitAudio);
            gameOver = true;
            gameOverText.isVisible = true;
            player.setAnimation("gameOver");
        }
    }
}