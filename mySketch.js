/* 
Disclaimer: This project was made for educational purposes. 

References: 
https://thecodingtrain.com/CodingChallenges/147-chrome-dinosaur.html
https://youtu.be/l0HoJHc-63Q 

Music: 
Cloud by Milktea 
(BuGuMi - https://www.youtube.com/watch?v=_JDfB8h3rRE)

Sound Effects: 
Gaming Sound FX
(https://www.youtube.com/watch?v=s5kc8xBMkXI)
https://www.youtube.com/watch?v=sQaKrJrVks4

Images: 
http://www.lowgif.com/view.html
https://clipartion.com/free-clipart-30007/
*/

let cenX, cenY;
let rabbitX; //The X position that the rabbit will always be 
let rabbitY; //The Y position that the rabbit will be at when it's not jumping
let rabbitImage, foxImage; //Image variables
let jumpSound, duckSound, tada; //Sound variables 
let start, restart, creditsButton; //Button variables

let foxes = []; //array of foxes 
let foxX; //fox's starting X position

let amp = 10; //amplitude of the wave 
let period = 300; //period of the wave 
let theta = 0; //angle 
let waveX; //x value
let waveYs = []; //y values 
let counters = []; //Counters for each of the 6 clouds 

let jitter = 5; //making the rabbit look like its moving
let gameCounter = 0; //the counter that helps the rabbit jitter and release the bacon
let running = false; //boolean to symbolize whether or not the game is still going
let score = 0; //keeps track of how many obstacles the player jumped over
let highScore = 0; //if the player plays the game multiple times, this is the value where the high score gets saved 
let tempHighScore = 0; //variable to temporarily hold the high score 

let jumpBool = false; //signifies if the player chose to jump 
let duckBool = false; //signifies if the player chose to duck
let titleBool = true; //boolean to signal whether the game hasn't started yet 
let gameOverBool = false; //boolean to signal whether the game is over 
let creditsBool = false; //boolean to signal whether the credits are being shown or not

function preload() {
	rabbitImage = loadImage('images/rabbit.png');
	foxImage = loadImage('images/fox.gif');
	jumpSound = loadSound('sounds/jumpsoundeffect.mp3');
	duckSound = loadSound('sounds/slip.mp3');
	tada = loadSound('sounds/tada.mp3');
	song = loadSound('sounds/cloud.mp3');
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	background(143, 243, 255);
	textAlign(CENTER);
	randomSeed(100); //Ensures that the random number generator will produce a different result every time the program is run 
	cenX = windowWidth/2;
	cenY = windowHeight/2;

	rabbitX = cenX/4;
	rabbitY = (windowHeight*3)/4;
	foxX = windowWidth+50;
	waveX = TWO_PI/period; //TWO_PI - built-in constant

	imageMode(CENTER);
	rabbitImage.resize(75, 0);
	foxImage.resize(100, 0);

	player = new PlayerObject(rabbitImage, rabbitX, rabbitY); //making a player object

	//Initializing the counters at the clouds' starting points	
	counters[0] = windowWidth;
	counters[1] = cenX;
	counters[2] = 0;
	counters[3] = (cenX*3)/2;
	counters[4] = cenX/2;
	counters[5] = -cenX/2;

	start = createButton("Start");
	start.position(cenX-35, 250);
	start.size(70, 30);
	start.mousePressed(startGame);

	restart = createButton("Restart");
	restart.hide(); //Hiding the button 
	restart.position(cenX-35, 250);
	restart.size(70, 30);
	restart.mousePressed(restartGame);
	
	creditsButton = createButton("Credits");
	creditsButton.hide();
	creditsButton.position(windowWidth-150, windowHeight-150);
	creditsButton.size(90, 50);
	creditsButton.mousePressed(showCredits);	
}

function draw() {
	background(143, 243, 255); //sky blue

	//CLOUDS		
	for (let i=0; i<6; i++) {
		//Making the clouds move over time 
		counters[i] += 0.8;

		if (counters[i] > windowWidth+(cenX/2)) {
			//Once they reach a certain point they start back at the left
			counters[i] = -cenX/2;
		}

		let tempY;
		if (i>=0 && i<3) {
			tempY = cenY/3;
		} else {
			tempY = cenY;
		}
		cloud(counters[i], tempY);
	}

	//Grass 
	wave();

	//Player
	gameCounter += 1;
	if (gameCounter%10 == 0) {
		jitter = -jitter; //Making the rabbit look like its walking 
	}
	player.show(jitter);

	if (jumpBool) {
		player.jump();
		player.checkJump();
	} else if (duckBool) {
		player.duck();
		player.checkDuck();
	}

	//Obstacles
	if (running) { //Game is running 

		//Displaying the score
		fill(0);
		noStroke();
		textSize(30);
		textFont('Fantasy');
		text("Current Score: " + score, 150, 50);
		text("Highest Score: " + highScore, 150, 80);

		//Shooting the obstacle out
		if (gameCounter%100 == 0) {
		
			//1-3 foxes will appear at a time
			let r = random(0, 3);
			let step = 0;
			for (let i=0; i<r; i++) {
				//The obstacle will appear between cenY+140 and cenY+180
				foxes[foxes.length] = new ObstacleObject(foxImage, foxX+step, cenY+150+random(0, 70));
				step += 100;
			}
		}

		for (let i=0; i<foxes.length; i++) {
			foxes[i].Display();
			foxes[i].UpdatePosition();
			let clashBool = foxes[i].Clash(player);
			if (!clashBool) { //The player crashed into the obstacle 
				tada.playMode('untilDone');
				tada.play();
				
				song.stop();
				running = false;
				gameOverBool = true;
			}
			let stopBool = foxes[i].Stop();
			if (stopBool) {
				//Get rid of that fox object when it reaches the left edge of the screen, meaning the player successfully jumped over it
				foxes.splice(0, 1);
				score++;
			}
		}
	} else { //Game not running
		//Get rid of the last fox object
		foxes.splice(0, 1);

		//Game hasn't started 
		if (titleBool) {
			titleScreen();
		}
		//Game over 
		if (gameOverBool) {
			
			if (creditsBool) {
				credits();
			} else {
				resultsScreen();
			}
		}
	}
}

//Controls the jumps
function keyPressed() {

	if (running) {
		//If the player presses the up arrow
		if (keyCode == UP_ARROW) {

			//then the rabbit jumps
			player.initiateJump();
			jumpBool = true;
			duckBool = false;

			jumpSound.play();

		} else if (keyCode == DOWN_ARROW) { //If the player presses the down arrow

			//then the rabbit ducks
			player.initiateDuck();
			duckBool = true;
			jumpBool = false;

			duckSound.play();
		}
	}
}

class PlayerObject {
	constructor(img, X, Y) {
		this.img = img;
		this.X = X; 
		this.Y = Y;
		this.velocity = 0;
		this.gravity = 2;
	}
	
	show(jitt) { //Displaying the image of the rabbit with its jitter value 
		image(this.img, this.X, this.Y+jitt);
	}
	
	initiateJump() {
		if (this.Y == (windowHeight*3)/4) {
			this.velocity = -30; //Size of the jump
		}
	}
	
	jump() {
		this.Y += this.velocity;
		this.velocity += this.gravity;
		this.Y = constrain(this.Y, 0, (windowHeight*3)/4);
	}
	
	checkJump() {
		if (this.Y >= (windowHeight*3)/4) {
			this.Y = (windowHeight*3)/4;
		}
	}
	
	initiateDuck() {
		if (this.Y == (windowHeight*3)/4) {
			this.velocity = -20; //Size of the duck 
		}
	}
	
	duck() {
		this.Y -= this.velocity;
		this.velocity += this.gravity;
		this.Y = constrain(this.Y, (windowHeight*3)/4, windowHeight);
	}
	
	checkDuck() {
		if (this.Y <= (windowHeight*3)/4) {
			this.Y = (windowHeight*3)/4;
		}
	}
}

class ObstacleObject {
	constructor(img, X, Y) {
		this.img = img;
		this.x = X;
		this.y = Y - 50;
	}

	Display() { //Displaying the image of the fox 
		image(this.img, this.x, this.y);
	}

	UpdatePosition() {
		this.x -= 20;
	}

	Clash(playerObj) { //If the player and obstacle intersect, then the player loses 
		let d = dist(this.x, this.y, playerObj.X, playerObj.Y);
		if (d < (playerObj.img.width/2)+(this.img.width/2) && d<(playerObj.img.height/2)+(this.img.height/2)) {
			return false;
		}
		return true;
	}
	
	Stop() {
		//Once the fox reaches the left end of the screen, then it stops 
		if (this.x <= -50) {
			return true;
		}
		return false;
	}
}

//Drawing the wave
function wave() {
	noStroke();

	//3 waves 
	for (let i=0; i<2; i++) {
		theta += 0.01; //increasing the angle 
		let x = theta; //temporary value

		//Drawing across the entire window
		for (let j=0; j<windowWidth; j++) {
			waveYs[j] = sin(x)*amp; //setting up the y values with the sin() function and the amplitude
			x += waveX; //incrementing the x value 
		}

		stroke(130, 255, 106); //green
		for (let k=0; k<windowWidth; k++) {
			line(k, waveYs[k] + (((windowHeight*2)/3) + 60), k, windowHeight);
		}
	}
}

//Drawing the clouds
function cloud(x, y) {
	noStroke();
	fill(255);
	ellipse(x, y, 65, 65);
	ellipse(x-60, y, 65, 65);
	ellipse(x+60, y, 65, 65);
	ellipse(x+30, y-30, 65, 65);
	ellipse(x-30, y-30, 65, 65);
	ellipse(x-30, y+30, 65, 65);
	ellipse(x+30, y+30, 65, 65);
	ellipse(x, y-50, 30, 30);
	ellipse(x, y+50, 30, 30);
	ellipse(x-60, y-30, 30, 30);
	ellipse(x+60, y+30, 30, 30);
}

function startGame() {
	titleBool = false;
	running = true;
	start.hide();
	song.loop();
}

function titleScreen() {
	//Welcome message
	fill(0);
	noStroke();
	textSize(60);
	textFont('Fantasy');
	text("Welcome!", cenX, 150);
	textSize(20);
	text("Duck or Jump with the Up and Down keys to avoid the foxes!", cenX, 200);
}

function resultsScreen() {
	if (score > highScore) {
		//High score message 
		fill('#0C31E8');
		noStroke();
		textSize(60);
		textFont('Fantasy');
		text("New High Score!", cenX, 100);

		tempHighScore = score;
	}
	restart.show(); //Showing the restart button 
	creditsButton.show(); //Showing the credits button 
	
	//Score message
	fill(0);
	noStroke();
	textSize(60);
	textFont('Fantasy');
	text("Score: " + score, cenX, 200);
}

function restartGame() {
	restart.hide();
	creditsButton.hide();

	//Reseting variables 
	highScore = tempHighScore; //If the new score beat the previous high score, then overwrite it 
	score = 0;
	gameCounter = 0;
	running = true;
	song.loop();
}

function showCredits() {
	creditsBool = !creditsBool; 
}

function credits() {
	restart.hide();
	background(143, 243, 255);
	
	//Credits 
	let top = cenY/4;
	
	fill(0);
	noStroke();
	textFont('Georgia');
	textSize(20);
	text("Credits", cenX, top);

	textSize(15);
	text("This game was made for educational purposes.", cenX, top+50);

	text("References:", cenX, top+100);
	text("https://thecodingtrain.com/CodingChallenges/147-chrome-dinosaur.html", cenX, top+125);
	text("https://youtu.be/l0HoJHc-63Q ", cenX, top+150);
	
	text("Music:", cenX, top+200);
	text("Cloud by Milktea", cenX, top+225);
	text("(BuGuMi - https://www.youtube.com/watch?v=_JDfB8h3rRE)", cenX, top+250);	
	
	text("Sound Effects:", cenX, top+300);
	text("Gaming Sound FX", cenX, top+325);
	text("(https://www.youtube.com/watch?v=s5kc8xBMkXI)", cenX, top+350);
	text("https://www.youtube.com/watch?v=sQaKrJrVks4", cenX, top+375);
	
	text("Images:", cenX, top+425);
	text("http://www.lowgif.com/view.html", cenX, top+450);
	text("https://clipartion.com/free-clipart-30007/", cenX, top+475);
}