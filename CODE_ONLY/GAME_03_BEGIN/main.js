/**
 In this game, you serve the waiters food as they appear.
 If you serve food without a waiter to receive it,
 or if an empty plate reaches the right of a table,
 you lose a spare plate.

 If you run out of spare plates, 
 or if a waiter reaches the right of a table, 
 the game is over.
 
 Game and assets are altered versions of those from:
 Viridino Studios (@ViridinoStudios)
 Wesley Andrade - Artist Twitter: @andrart7
 E-mail: wesleymatos1989@gmail.com
 https://www.patreon.com/viridinostudios
**/

// Difficulty parameters
const PLAYER_DELAY = 0.3; // Time taken by the player to change tables
const FOOD_DELAY = 1; // Time taken by the food to move through the table
const WAITER_DELAY = 6; // Time taken by the waiter to move through the table
const WAITER_SPAWN_START = 5; // Maximum time required to spawn a waiter
const WAITER_SPAWN_REDUCE = 0.2; // Time reduction to spawn the next waiter
const WAITER_SPAWN_END = 1.4; // Minimum time required to spawn a waiter
const PLATE_DELAY = 4; // Time taken by empty plate to move through the table
const PLATE_SPAWN_CHANCE = 0.25; // How likely an empty plate is to spawn
const MIN_WAITERS_FOR_PLATE_SPAWN = 4; // Min amount of people to spawn plate
const STARTING_SPARE_PLATES = 2; // With how many spare plates the player starts
const STARTING_POS_INDEX = 2; // Player's starting position index
const WAITING_TIME = 500; // Waiting time before the inputs are enabled

// Settings
const MAX_THROWING_FRAME = 3; // Maximum frame number for throwing animation
const MAX_WAITERS_ANIMATION_NUMBER = 2; // Maximum number of people animations
const MAX_FOOD_FRAME = 4; // Maximum frame number for the plate

// Gameplay variables
let playerPositionsIndex = STARTING_POS_INDEX; // Current player position index
let playerMoving = false; // Is the player making a move right now?
let currentWaiterSpawnTime = WAITER_SPAWN_START; // Time taken to spawn a waiter
let numberOfWaitersSpawned = 0; // Number of people spawned
let score = 0; // Player's score
let sparePlates = STARTING_SPARE_PLATES; // Player's spare plates
let controlsEnabled = false; // Player can input
let bonusSpawned = false;

/* These variables store object instances that are referenced later.
 * Their names reflect which objects they will later be assigned to
 */
let keyboard;
let player;
let timer;
let statsText;
let gameOverText;
let gameOverMask;
let playerMovementTween;

// The game has multiple positions for players, food, and waiters.
// These variables will hold arrays for each.
let playerPositions;
let foodPositions;
let waiterPositions;

/**
This function runs when the game is loading.
*/
runOnStartup(async runtime => {

    runtime.addEventListener(
        "beforeprojectstart", () => onBeforeProjectStart(runtime)
    );
});


/**
This function runs before the first layout is created
*/
async function onBeforeProjectStart(runtime) {

    // Get important instances and behaviors
    keyboard = runtime.keyboard;
    player = runtime.objects.Player.getFirstInstance();
    timer = runtime.objects.TimerManager.getFirstInstance().behaviors.Timer;
    statsText = runtime.objects.ScoreText.getFirstInstance();
    gameOverText = runtime.objects.GameOverText.getFirstInstance();
    gameOverMask = runtime.objects.gameOverMask.getFirstInstance();

    // Get important lists of instances
    playerPositions = runtime.objects.PositionPlayer.getAllInstances();
    foodPositions = runtime.objects.PositionFood.getAllInstances();
    waiterPositions = runtime.objects.PositionPerson.getAllInstances();

    // Start waiter-spawn timer
    timer.addEventListener("timer", e => onTimer(e, runtime));
    timer.startTimer(currentWaiterSpawnTime, "characterspawn", "once");

    // Wait a little before the player can input
    setTimeout(() => controlsEnabled = true, WAITING_TIME);

    // Start ticking
    runtime.addEventListener("tick", () => onTick(runtime));
}


/**
This function runs on every tick.
*/
function onTick(runtime) {
    // Functions called on every tick
    getPlayerInputs(runtime);
    resetPlayerAnimAndSpawnPlate(runtime);
    makeWaiterGoAway(runtime);
    checkWaiterAndFoodCollision(runtime);
    breakFoodPlates(runtime);
}


/**
This function runs every time the timer elapses.
*/
function onTimer(e, runtime) {

    // Time to spawn a character
    if (e.tag == "characterspawn") {
        // Create a waiter at a random table
        const positionIndex = Math.floor(Math.random() * 4);
        const waiter = runtime.objects.Waiter.createInstance(
            "Game",
            waiterPositions[positionIndex].x + 1,
            waiterPositions[positionIndex].y
        );
        waiter.setAnimation("Person_" + Math.floor(
            Math.random() * MAX_WAITERS_ANIMATION_NUMBER
        ));
        waiter.instVars.lane = positionIndex;
        // Start movement Tween
        waiter.behaviors.Tween.startTween(
            "position",
            [waiterPositions[positionIndex].instVars.maxX, waiter.y],
            WAITER_DELAY,
            "linear"
        );
        // Reduce spawn time and reset timer
        if (currentWaiterSpawnTime - WAITER_SPAWN_REDUCE >= WAITER_SPAWN_END) {
            currentWaiterSpawnTime -= WAITER_SPAWN_REDUCE;
        }
        timer.startTimer(currentWaiterSpawnTime, "characterspawn", "once");
        // Increase number of people spawned
        numberOfWaitersSpawned += 1;

        // Should an empty plate be spawned?
        if (
            Math.random() < PLATE_SPAWN_CHANCE &&
            numberOfWaitersSpawned > MIN_WAITERS_FOR_PLATE_SPAWN
        ) {
            // Create the plate
            const plate = runtime.objects.Pizza.createInstance(
                "Game",
                foodPositions[positionIndex].instVars.minX + 1,
                foodPositions[positionIndex].y
            );
            // Set the animation to the empty version
            plate.setAnimation("Empty");
            // Start movement Tween
            plate.behaviors.Tween.startTween(
                "position",
                [foodPositions[positionIndex].x, plate.y],
                PLATE_DELAY,
                "linear"
            );
        }
    }
}


/**
This function runs on every tick.  
Checks for the user's key presses, and executes the proper action.
*/
function getPlayerInputs(runtime) {

    // If the user presses "R" and the game is over, reset the game.
    if (keyboard.isKeyDown("KeyR") && gameOverText.isVisible) {
        resetGame(runtime);
    }

    // controlsEnabled is a boolean (true or false) value.  If controlsEnabled is false,
    // return from this function without doing anything further.
    if (!controlsEnabled) return;

    // The player cannot change input while a movement is happening
    // If movementStopped & throwingStopped variables are both true, playerMoving = false.
    if (!playerMoving) {
        // Player moves down
        if (keyboard.isKeyDown("ArrowDown") && playerPositionsIndex < 3) {
            playerPositionsIndex += 1;
            moveThePlayer("RunningDown");
            playerMoving = true;

            // Player moves up
        } else if (keyboard.isKeyDown("ArrowUp") && playerPositionsIndex > 0) {
            playerPositionsIndex -= 1;
            moveThePlayer("RunningUp");
            playerMoving = true;

            // Player throws food
        } else if (keyboard.isKeyDown("Space")) {
            player.setAnimation("Throwing");
            playerMoving = true;
        }
    }
}


/**
This function runs on every tick.  
Check if the player stopped moving, if so, reset player movement
**/
function resetPlayerAnimAndSpawnPlate(runtime) {

    // If playerMovementTween is not null, the player is moving up or down.
    // playerMovementTween.isReleased is true if the tween has completed.
    const movementStopped = playerMovementTween &&
        playerMovementTween.isReleased;

    // throwingStopped  = true when the player's animation is "Throwing" and the
    // "Throwing" animation is at its last frame.
    const throwingStopped = player.animationName == "Throwing" &&
        player.animationFrame == MAX_THROWING_FRAME;

    // Reset player movement, if any of the above 2 has stopped
    if (movementStopped || throwingStopped) {
        playerMoving = false;
        playerMovementTween = null;
        player.setAnimation("Idle");
    }

    // After the Player's throwing animation stops, Spawn the Pizza sprite.
    if (throwingStopped) {
        const food = runtime.objects.Pizza.createInstance(
            "Game",
            foodPositions[playerPositionsIndex].x - 1,
            foodPositions[playerPositionsIndex].y
        );
        food.animationFrame = Math.floor(Math.random() * (MAX_FOOD_FRAME + 1));
        food.behaviors.Tween.startTween(
            "position",
            [foodPositions[playerPositionsIndex].instVars.minX, food.y],
            FOOD_DELAY,
            "linear"
        )
    }
}


/**
This function runs on every tick.  
It checks if a Waiter is at the leftmost X value (destroy) or rightmost X value (game over).
*/
function makeWaiterGoAway(runtime) {
    // Get all Waiter instances
    const waiters = runtime.objects.Waiter.getAllInstances();

    // Create arrays for leftmost and rightmost X values
    const leftmostXValues = [...Array(4).keys()].map(i => waiterPositions[i].x);
    const rightmostXValues = [...Array(4).keys()].map(i => waiterPositions[i].instVars.maxX);

    // If any waiter has reached a possible ending position, execute an action
    for (const waiter of waiters) {
        // Destroy waiter when waiter reaches leftmost X value
        if (leftmostXValues.includes(waiter.x)) {
            waiter.destroy();
            // End game when waiter reaches rightmost X value
        } else if (rightmostXValues.includes(waiter.x)) {
            gameOver(runtime); // Customer lost -> Game over!
        }
    }
}


/**
This function runs on every tick.  
If Full Pizza plate touches Waiter, send waiter back left holding food.
*/
function checkWaiterAndFoodCollision(runtime) {
    // Check if a waiter got a full food plate

    // Get all current Waiters and foods
    const waiters = runtime.objects.Waiter.getAllInstances();
    const foods = runtime.objects.Pizza.getAllInstances();

    // Get all people
    for (const waiter of waiters) {
        // Get all full food plates
        for (const food of foods) {
            // Check if a full plate is overlapping a waiter
            if (waiter.testOverlap(food) && food.animationName == "Full") {
                // Stop all current Tweens
                for (const tween of waiter.behaviors.Tween.allTweens()) {
                    tween.stop();
                }
                // Start a new tween to go back to the left
                waiter.behaviors.Tween.startTween(
                    "position",
                    [waiterPositions[waiter.instVars.lane].x, waiter.y],
                    Math.abs(waiter.x - waiterPositions[waiter.instVars.lane].x) / 64,
                    "linear"
                );
                try {
                    waiter.setAnimation(waiter.animationName + "_Hold");
                    food.destroy();
                    score += 1;
                    updateStats();

                } catch (_) {
                    // Person already going away, so ignore it
                }
            }
        }
    }
}


/**
This function runs on every tick.  
Breaks food plates when they reach any of the ends of a table
*/
function breakFoodPlates(runtime) {

    // Get all Food instances
    const foods = runtime.objects.Pizza.getAllInstances();

    // Create lists/arrays of possible minimum and maximum food positions
    const minXValues = [...Array(4).keys()].map(i => foodPositions[i].instVars.minX);
    const foodXValues = [...Array(4).keys()].map(i => foodPositions[i].x);

    // If any food has reached a possible ending position, break the plate
    for (const m of foods) {
        // Leftmost X - Animation is "Full" or "Empty" not "Broken".
        if (minXValues.includes(m.x) && m.animationName.length < 6) {
            m.setAnimation("Broken");
            m.addEventListener("animationend", (e) => onFoodAnimationEnd(e));
            sparePlates -= 1; // If no spare, then it is game over!
            if (sparePlates < 0) gameOver(runtime);
            else updateStats();
            // Rightmost X and player is not close
        } else if (foodXValues.includes(m.x) && m.animationName.length < 6) {
            if (!playerMovementTween && Math.abs(player.y - m.y) < 16) {
                m.destroy();
            } else {
                m.setAnimation("Broken");
                m.addEventListener(
                    "animationend", (e) => onFoodAnimationEnd(e)
                );
                sparePlates -= 1; // If no spare, then it is game over!
                if (sparePlates < 0) gameOver(runtime);
                else updateStats();
            }
        }
    }
}



/**
Helper function to move the player called from getPlayerInputs().
*/
function moveThePlayer(newAnimation) {
    // Set Tween
    const newPosition = [
        playerPositions[playerPositionsIndex].x,
        playerPositions[playerPositionsIndex].y
    ];
    playerMovementTween = player.behaviors.Tween.startTween(
        "position", newPosition, PLAYER_DELAY, "out-sine"
    );

    // Set Animation
    player.setAnimation(newAnimation);
}

/**
Called after animation ends to destroy the food or bonus plate
*/
function onFoodAnimationEnd(e) {
    e.instance.destroy();
}

/**
Called to update the stats on the screen.
*/
function updateStats() {
    statsText.text = "Spare Plates: " + Math.max(sparePlates, 0) + "\nScore: " + score;
}


/**
Called when sparePlates < 0 or waiter reaches rightmost value.
*/
function gameOver(runtime) {

    // Disable controls
    controlsEnabled = false;

    // Get all current waiters and foods
    const waiters = runtime.objects.Waiter.getAllInstances();
    const foods = runtime.objects.Pizza.getAllInstances();

    // Stop all Timers
    timer.stopTimer("characterspawn");

    // Stop all people Tweens
    for (const waiter of waiters)
        for (const t of waiter.behaviors.Tween.allTweens())
            t.stop();

    // Stop all Food Tweens
    for (const food of foods)
        for (const t of food.behaviors.Tween.allTweens())
            t.stop();

    // Show Game Over text and mask
    gameOverText.isVisible = true;
    gameOverMask.isVisible = true;
}


/**
Reset the game when the game is over and the user presses "R".
*/
function resetGame(runtime) {

    // Set Game Over text and mask as invisible
    gameOverText.isVisible = false;
    gameOverMask.isVisible = false;

    // Get all current waiters and foods
    const waiters = runtime.objects.Waiter.getAllInstances();
    const foods = runtime.objects.Pizza.getAllInstances();

    // Delete all people
    for (const w of waiters)
        w.destroy();

    // Delete all Foods
    for (const food of foods)
        food.destroy();

    // Reset gameplay variables
    playerPositionsIndex = STARTING_POS_INDEX;
    playerMoving = false;
    currentWaiterSpawnTime = WAITER_SPAWN_START;
    numberOfWaitersSpawned = 0;
    score = 0;
    sparePlates = STARTING_SPARE_PLATES;
    player.x = playerPositions[playerPositionsIndex].x;
    player.y = playerPositions[playerPositionsIndex].y;

    // Reset statsText
    updateStats();

    // Start timer
    timer.startTimer(currentWaiterSpawnTime, "characterspawn", "once");

    // Wait a little before the player can input
    setTimeout(() => controlsEnabled = true, WAITING_TIME);
}