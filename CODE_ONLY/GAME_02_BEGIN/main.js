/**
We created a Top-Down Role Playing Game (RPG).  The goal is to find the key
and to solve the puzzle.

Game characters:
https://mikanimus.itch.io/pack-npc-32x32-topdown-rpg

Game backgrounds and props:
https://cainos.itch.io/pixel-art-top-down-basic

Game Keys:
https://dantepixels.itch.io/key-items-16x16
*/
const WIZARD_TEXT = "Our village is peaceful, but the Jester is always playing tricks."
const SHOPKEEPER_TEXT = "That silly Jester locked up my shop's inventory and hid the key somewhere in the village."
const KNIGHT_TEXT = "The Jester locked up my sword. What kind of Knight doesn't have a sword?"
const NO_KEY_TEXT = "Ha Ha! You don't have the key to open the chest."
const HAS_KEY_TEXT = "Hooray! You found the key to open the chest."


let playerBox;
let playerAnim;
let keyboard;
let playersText;
let chest;
let key;
let hasKey = false;

// Variables for characters and their profile cards.
let wizard;
let profileWizard;

let shopkeeper;
let profileShopkeeper;

let knight;
let profileKnight;

let jester;
let profileJester;

runOnStartup(async runtime => {

    runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime) {
    playerBox = runtime.objects.PlayerBox.getFirstInstance();
    playerAnim = runtime.objects.PlayerAnim.getFirstInstance();
    keyboard = runtime.keyboard;
    playersText = runtime.objects.TextPlayers.getFirstInstance();
    chest = runtime.objects.Chest.getFirstInstance();
    key = runtime.objects.Key.getFirstInstance();

    wizard = runtime.objects.Wizard.getFirstInstance();
    profileWizard = runtime.objects.ProfileWizard.getFirstInstance();

    shopkeeper = runtime.objects.Shopkeeper.getFirstInstance();
    profileShopkeeper = runtime.objects.ProfileShopkeeper.getFirstInstance();

    knight = runtime.objects.Knight.getFirstInstance();
    profileKnight = runtime.objects.ProfileKnight.getFirstInstance();

    jester = runtime.objects.Jester.getFirstInstance();
    profileJester = runtime.objects.ProfileJester.getFirstInstance();


    runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime) {
    getInputsAndMove();
    checkForCollisions(runtime);
}

function getInputsAndMove() {

    // Set the PlayerBox and PlayerAnim to the same location
    playerAnim.setPosition(playerBox.x, playerBox.y);


    if (keyboard.isKeyDown("ArrowRight")) {
        playerAnim.instVars.Direction = "Right";
        playerAnim.setAnimation("walkRight");
    } else if (keyboard.isKeyDown("ArrowLeft")) {
        playerAnim.instVars.Direction = "Left";
        playerAnim.setAnimation("walkLeft");
    } else if (keyboard.isKeyDown("ArrowUp")) {
        playerAnim.instVars.Direction = "Up";
        playerAnim.setAnimation("walkUp");
    } else if (keyboard.isKeyDown("ArrowDown")) {
        playerAnim.instVars.Direction = "Down";
        playerAnim.setAnimation("walkDown");
    } else {
        playerAnim.setAnimation("idle" + playerAnim.instVars.Direction);
    }

}

function checkForCollisions(runtime) {

    if (playerBox.testOverlap(wizard)) {
        profileWizard.isVisible = true;
        playerAnim.isVisible = false;
        wizard.isVisible = false;
        playersText.text = WIZARD_TEXT;
        playersText.isVisible = true;
    } else if (playerBox.testOverlap(shopkeeper)) {
        profileShopkeeper.isVisible = true;
        playerAnim.isVisible = false;
        shopkeeper.isVisible = false;
        playersText.text = SHOPKEEPER_TEXT;
        playersText.isVisible = true;
    } else if (playerBox.testOverlap(knight)) {
        profileKnight.isVisible = true;
        playerAnim.isVisible = false;
        knight.isVisible = false;
        playersText.text = KNIGHT_TEXT;
        playersText.isVisible = true;
    } else if (playerBox.testOverlap(chest)) {
        profileJester.isVisible = true;
        const chestAnimation = (hasKey) ? "open" : "closed";
        chest.setAnimation(chestAnimation);
        playerAnim.isVisible = false;
        jester.isVisible = false;
        playersText.text = (hasKey) ? HAS_KEY_TEXT : NO_KEY_TEXT;
        playersText.isVisible = true;
    } else {
        profileWizard.isVisible = false;
        profileShopkeeper.isVisible = false;
        profileKnight.isVisible = false;
        profileJester.isVisible = false;
        playersText.isVisible = false;
        wizard.isVisible = true;
        shopkeeper.isVisible = true;
        knight.isVisible = true;
        jester.isVisible = true;
        playerAnim.isVisible = true;
        knight.isVisible = true;
    }

    // Test Key Collision
    if (key != null) {
        if (playerBox.testOverlap(key)) {
            key.destroy();
            key = null;
            hasKey = true;
        }
    }

}