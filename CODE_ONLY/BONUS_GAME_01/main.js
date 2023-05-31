let player;
let tilemaps;
let springs;
let coins;
let bugs;
let bats;

const START_X = 36;
const START_Y = 180;

runOnStartup(async runtime =>
{
	// Code to run on the loading screen.
	// Note layouts, objects etc. are not yet available.
	
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime) {
    player = runtime.objects.Player.getFirstInstance();
	tilemaps = runtime.objects.Tilemap.getAllInstances();
	springs = runtime.objects.Spring.getAllInstances();
	coins = runtime.objects.Coin.getAllInstances();
	bugs = runtime.objects.Bug.getAllInstances();
	bats = runtime.objects.Bat.getAllInstances();
	
	runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime) {
	checkForCollisions(runtime);// Code to run every tick
}

function checkForCollisions(runtime) {
    for (const spring of springs) {
	    if (player.testOverlap(spring)) {
		  spring.setAnimation("Spring");
		  player.behaviors.Platform.vectorY = -400;
		}
	}
	
	for (const coin of coins) {
	  if (player.testOverlap(coin)){
	    coin.destroy();
	    break;
	  }
	}
    coins = runtime.objects.Coin.getAllInstances();
	
	// Make each bug (which has Bullet Behavior) move back and forth between tilemap boundaries.
	for (const tilemap of tilemaps) {
	  for (const bug of bugs) {
	    // By default, each bug is touching the floor, so move it up 5 pixels off the floor.
	    bug.offsetPosition(0, -5);
		// If it's still touching, it must be on the left or right side (not the floor)
	    if (bug.testOverlap(tilemap)) {
		  // toggle angleOfMotion between either 0 or Math.PI radians (0, or 180 degrees)
		  const angle = bug.behaviors.Bullet.angleOfMotion;
		  bug.behaviors.Bullet.angleOfMotion = (angle == 0) ? Math.PI : 0;
		}
		// Move the bug back to the floor position
		bug.offsetPosition(0, 5);
	  }
	}
	
	// Player-Bug collision (If player jumps on bug, destroy bug, if not, respawn player).
	for (const bug of bugs) {
	  if (player.testOverlap(bug)) {
	    if (player.behaviors.Platform.isOnFloor) {
		  // if player.behaviors.Platform.isOnFloor is true, player is 
		  // currently standing on a solid or jump-thru
		  // i.e., not jumping when it touches the bug
          player.setPosition(START_X, START_Y);
		} else {
		  // Bounce the player up 200 pixels
		  player.behaviors.Platform.vectorY = -200;
		  bug.destroy();
		  // A bug was destroyed, so the bug array now has null values.
		  // Break out of the bugs for loop and re-populate the bugs array.
		  break;
		}
	  }
	}
	bugs = runtime.objects.Bug.getAllInstances();
	
	// TO DO: Using the bug code above as a guide, code the collision between the player & bat.
	// HINT: Bats aren't on the floor, so respawn the player if the player's y value (player.y) 
	// is greater than or equal to (>=) the bat's y value (bat.y). 
	
	
	
	
	
	
}
