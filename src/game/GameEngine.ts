export interface GameObject {
  x: number;
  y: number;
  id: number;
}

export interface Player extends GameObject {
  size: number;
}

export interface GameState {
  state: 'start' | 'playing' | 'nameInput' | 'rankings';
  level: number;
  lives: number;
  score: number;
  finalScore: number;
  player: Player;
  arrows: GameObject[];
  confusionItems: GameObject[];
  slowItems: GameObject[];
  speedTrails: Array<GameObject & { opacity: number }>;
  isConfused: boolean;
  confusionTime: number;
  isSlowed: boolean;
  slowTime: number;
  isInvincible: boolean;
  invincibilityTime: number;
  items: {
    shield: { count: number; active: boolean; time: number };
    speed: { count: number; active: boolean; time: number };
  };
}

export class GameEngine {
  private gameState: GameState;
  private gameLoopId: NodeJS.Timeout | null = null;
  private collisionProcessing = false;
  
  private readonly GAME_WIDTH = 320;
  private readonly GAME_HEIGHT = 480;
  private readonly PLAYER_SIZE = 50;

  constructor() {
    this.gameState = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      state: 'start',
      level: 1,
      lives: 3,
      score: 0,
      finalScore: 0,
      player: { x: this.GAME_WIDTH / 2, y: this.GAME_HEIGHT - 60, size: this.PLAYER_SIZE, id: 0 },
      arrows: [],
      confusionItems: [],
      slowItems: [],
      speedTrails: [],
      isConfused: false,
      confusionTime: 0,
      isSlowed: false,
      slowTime: 0,
      isInvincible: false,
      invincibilityTime: 0,
      items: {
        shield: { count: 1, active: false, time: 0 },
        speed: { count: 1, active: false, time: 0 }
      }
    };
  }

  getState(): GameState {
    return { ...this.gameState };
  }

  startGame(): void {
    this.gameState = {
      ...this.createInitialState(),
      state: 'playing'
    };
    this.collisionProcessing = false;
    this.startGameLoop();
  }

  private startGameLoop(): void {
    if (this.gameLoopId) {
      clearInterval(this.gameLoopId);
    }
    this.gameLoopId = setInterval(() => this.gameLoop(), 16);
  }

  stopGameLoop(): void {
    if (this.gameLoopId) {
      clearInterval(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  private gameLoop(): void {
    if (this.gameState.state !== 'playing') return;

    this.updatePlayer();
    this.spawnGameObjects();
    this.updateGameObjects();
    this.checkCollisions();
    this.updateScore();
  }

  private updatePlayer(): void {
    // Player movement logic would be handled by the component
    // This method can be called with movement data
  }

  movePlayer(direction: 'left' | 'right', keys: { [key: string]: boolean }, touchControls: { left: boolean; right: boolean }): void {
    if (this.gameState.state !== 'playing') return;

    const baseSpeed = this.gameState.items.speed.active ? 3 : 2;
    const speed = this.gameState.isSlowed ? Math.max(1, baseSpeed * 0.3) : baseSpeed;

    const isMovingLeft = keys['arrowleft'] || keys['a'] || touchControls.left;
    const isMovingRight = keys['arrowright'] || keys['d'] || touchControls.right;

    let newX = this.gameState.player.x;

    if (isMovingLeft) {
      newX = Math.max(this.PLAYER_SIZE / 2, this.gameState.player.x - speed);
      this.addSpeedTrail();
    }
    if (isMovingRight) {
      newX = Math.min(this.GAME_WIDTH - this.PLAYER_SIZE / 2, this.gameState.player.x + speed);
      this.addSpeedTrail();
    }

    this.gameState.player.x = newX;
  }

  private addSpeedTrail(): void {
    if (this.gameState.items.speed.active && Math.random() < 0.3) {
      this.gameState.speedTrails.push({
        x: this.gameState.player.x,
        y: this.gameState.player.y,
        id: Date.now() + Math.random(),
        opacity: 1
      });
    }
  }

  private spawnGameObjects(): void {
    // Spawn arrows
    if (Math.random() < (this.gameState.level >= 2 ? 0.04 : 0.02)) {
      this.gameState.arrows.push({
        x: Math.random() * (this.GAME_WIDTH - 20) + 10,
        y: 0,
        id: Date.now() + Math.random()
      });
    }

    // Spawn confusion items (level 3)
    if (this.gameState.level >= 3 && Math.random() < 0.01) {
      this.gameState.confusionItems.push({
        x: Math.random() * (this.GAME_WIDTH - 20) + 10,
        y: 0,
        id: Date.now() + Math.random()
      });
    }

    // Spawn slow items (level 4)
    if (this.gameState.level >= 4 && Math.random() < 0.015) {
      this.gameState.slowItems.push({
        x: Math.random() * (this.GAME_WIDTH - 20) + 10,
        y: 0,
        id: Date.now() + Math.random()
      });
    }
  }

  private updateGameObjects(): void {
    // Update arrows
    this.gameState.arrows = this.gameState.arrows
      .map(arrow => ({ ...arrow, y: arrow.y + 6 }))
      .filter(arrow => arrow.y > -20 && arrow.y < this.GAME_HEIGHT + 20);

    // Update confusion items
    this.gameState.confusionItems = this.gameState.confusionItems
      .map(item => ({ ...item, y: item.y + 4 }))
      .filter(item => item.y < this.GAME_HEIGHT + 20);

    // Update slow items
    this.gameState.slowItems = this.gameState.slowItems
      .map(item => ({ ...item, y: item.y + 4 }))
      .filter(item => item.y < this.GAME_HEIGHT + 20);

    // Update speed trails
    this.gameState.speedTrails = this.gameState.speedTrails
      .map(trail => ({ ...trail, opacity: trail.opacity - 0.05 }))
      .filter(trail => trail.opacity > 0);

    // Update timers
    this.updateTimers();
  }

  private updateTimers(): void {
    // Update item timers
    Object.keys(this.gameState.items).forEach(key => {
      const item = this.gameState.items[key as keyof typeof this.gameState.items];
      if (item.active && item.time > 0) {
        item.time -= 16;
        if (item.time <= 0) {
          item.active = false;
          item.time = 0;
        }
      }
    });

    // Update confusion
    if (this.gameState.confusionTime > 0) {
      this.gameState.confusionTime -= 16;
      if (this.gameState.confusionTime <= 0) {
        this.gameState.isConfused = false;
        this.gameState.confusionTime = 0;
      }
    }

    // Update slow effect
    if (this.gameState.slowTime > 0) {
      this.gameState.slowTime -= 16;
      if (this.gameState.slowTime <= 0) {
        this.gameState.isSlowed = false;
        this.gameState.slowTime = 0;
      }
    }

    // Update invincibility
    if (this.gameState.invincibilityTime > 0) {
      this.gameState.invincibilityTime -= 16;
      if (this.gameState.invincibilityTime <= 0) {
        this.gameState.isInvincible = false;
        this.gameState.invincibilityTime = 0;
      }
    }
  }

  private checkCollisions(): void {
    this.checkConfusionCollisions();
    this.checkSlowCollisions();
    this.checkArrowCollisions();
  }

  private checkConfusionCollisions(): void {
    const remainingItems: GameObject[] = [];
    let confused = false;

    this.gameState.confusionItems.forEach(item => {
      const distance = Math.sqrt(
        Math.pow(item.x - this.gameState.player.x, 2) + 
        Math.pow(item.y - this.gameState.player.y, 2)
      );

      if (distance < (20 + this.PLAYER_SIZE) / 2) {
        confused = true;
      } else {
        remainingItems.push(item);
      }
    });

    this.gameState.confusionItems = remainingItems;

    if (confused && !this.gameState.items.shield.active) {
      this.gameState.isConfused = true;
      this.gameState.confusionTime = 3000;
    }
  }

  private checkSlowCollisions(): void {
    const remainingItems: GameObject[] = [];
    let slowed = false;

    this.gameState.slowItems.forEach(item => {
      const distance = Math.sqrt(
        Math.pow(item.x - this.gameState.player.x, 2) + 
        Math.pow(item.y - this.gameState.player.y, 2)
      );

      if (distance < (20 + this.PLAYER_SIZE) / 2) {
        slowed = true;
      } else {
        remainingItems.push(item);
      }
    });

    this.gameState.slowItems = remainingItems;

    if (slowed && !this.gameState.items.shield.active) {
      this.gameState.isSlowed = true;
      this.gameState.slowTime = 4000;
    }
  }

  private checkArrowCollisions(): void {
    if (this.gameState.isInvincible || this.collisionProcessing) return;
    
    for (const arrow of this.gameState.arrows) {
      const distance = Math.sqrt(
        Math.pow(arrow.x - this.gameState.player.x, 2) + 
        Math.pow(arrow.y - this.gameState.player.y, 2)
      );

      if (distance < 35) {
        this.collisionProcessing = true;
        
        if (!this.gameState.items.shield.active) {
          const damage = this.gameState.isConfused ? 2 : 1;
          this.gameState.lives = Math.max(0, this.gameState.lives - damage);
          
          if (this.gameState.lives <= 0) {
            this.gameState.finalScore = this.gameState.score;
            this.gameState.state = 'nameInput'; // This would be handled by parent component
          }
          
          this.gameState.isInvincible = true;
          this.gameState.invincibilityTime = 1500;
        }
        
        this.gameState.arrows = this.gameState.arrows.filter(arr => arr.id !== arrow.id);
        
        setTimeout(() => {
          this.collisionProcessing = false;
        }, 500);
        
        break;
      }
    }
  }

  private updateScore(): void {
    this.gameState.score += 1;
    if (this.gameState.score > 0 && this.gameState.score % 500 === 0 && this.gameState.level < 4) {
      this.gameState.level += 1;
    }
  }

  useItem(itemType: 'shield' | 'speed'): boolean {
    if (this.gameState.state !== 'playing') return false;
    if (this.gameState.isInvincible) return false;
    
    const item = this.gameState.items[itemType];
    if (item.count > 0 && !item.active) {
      item.count -= 1;
      item.active = true;
      item.time = itemType === 'shield' ? 3000 : 5000;
      return true;
    }
    return false;
  }

  setState(newState: 'start' | 'playing' | 'nameInput' | 'rankings'): void {
    this.gameState.state = newState;
    if (newState !== 'playing') {
      this.stopGameLoop();
    } else if (newState === 'playing') {
      this.startGameLoop();
    }
  }

  setFinalScore(score: number): void {
    this.gameState.finalScore = score;
  }

  destroy(): void {
    this.stopGameLoop();
  }
}