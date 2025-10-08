import { GameEngine } from './engine/GameEngine.js';
import { NetworkManager } from './network/NetworkManager.js';
import { LobbyManager } from './engine/LobbyManager.js';
import { DialogueUI } from './dialogueUI.js';

// Initialize the game when DOM and stylesheets are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for stylesheets to load to prevent FOUC and layout forcing
    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', initializeGame);
    } else {
        // Use requestAnimationFrame to ensure rendering is ready
        requestAnimationFrame(initializeGame);
    }
});

function initializeGame() {
    if (document.readyState !== 'complete') {
        return;
    }
    
    const canvas = document.getElementById('gameCanvas');
    
    // Initialize network manager
    const networkManager = new NetworkManager();
    
    // Initialize lobby manager
    const lobbyManager = new LobbyManager(networkManager);
    
    // Initialize game engine (handles all canvas setup)
    const gameEngine = new GameEngine(canvas, networkManager);
    
    // Connect lobby to game engine
    lobbyManager.onGameStart = (data) => {
        console.log('Starting game with data:', data);
        gameEngine.startMultiplayerGame(data);
    };
    
    // Connect to server
    networkManager.connect();
    
    console.log('Sacrifices Must Be Made - Lobby and Game Initialized');
}
import LevelManager from './LevelManager.js';

async function testLevelManager() {
  const lm = new LevelManager();

  // Start level 1
  const level = await lm.startLevel(1);
  console.log("Loaded level:", level);

  // Show alive players
  console.log("Alive players:", lm.getAlivePlayers());

  // Kill one player
  const victim = lm.killRandomPlayer();
  console.log("Victim:", victim);

  // Save and reload state
  lm.saveState();
  lm.loadState();
  console.log("Restored state:", lm);
}

testLevelManager();
const dialogue = new DialogueUI();

// Example: show a message after 2 seconds
setTimeout(() => {
  dialogue.show("Welcome to Containment Crew! Choose wisely...");
}, 2000);

// Example: hide after 5 seconds
setTimeout(() => {
  dialogue.hide();
}, 7000);
