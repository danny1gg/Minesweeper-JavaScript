let minesTable = getById("mines_table");
let clockBar = getById("clock_bar");
let emoticon = getById("emoticon");
let timer = getById("timer_clock");
let inputRowsCols = getById("game_width").value;
let inputMines = getById("game_mines").value;
let displayNrMines = getById("display_nr_mines");
let errorMsg = getById("error_msg");
let mines = [], randomMineLocationRow, randomMineLocationCol;
let seconds = 0, tickTack = [], status = "playing", solvedCells = 0;
let surroundingNeighbourCells = [], flagedCells = [];
const FLAG = "css/emoticons/flag.png";
const MINE = "css/emoticons/mine.png"; 
timer.innerHTML = "00" + seconds;
startGame();

function getById(id) { // ====== shortcut function to obtain the element id
	return document.getElementById(id);
}

function setLocation(row, col) { // ====== set the cell location to the id
	return "cell_" + row + "_" + col;
}

function displayError(id, errMsg) { 
	getById(id).style.background = "#E57171";
	errorMsg.innerHTML = errMsg;
	errorMsg.style.visibility = "visible";
} 

function resetErrorMsg() {
	let inputId = event.srcElement.id;
	getById(inputId).style.background = "white";
	errorMsg.style.visibility = "hidden";
}

function checkStatus() { // ========= check game status
	switch (status) {
		case "lost":
			emoticon.setAttribute('src', 'css/emoticons/sad.png');
			break;
		case "won": 
			emoticon.setAttribute('src', 'css/emoticons/cool.png');
			break;
		default:
			emoticon.setAttribute('src', 'css/emoticons/happy.png');
	}
}

function updateGameSpecs() {
	let tempInputRowsCols = getById("game_width").value;
	let tempInputMines = getById("game_mines").value;
	// check if the entered values are matching the requirements
	if (checkGameRequirements(tempInputRowsCols, tempInputMines)) { 
		surroundingNeighbourCells = [];
		inputRowsCols = tempInputRowsCols;
		inputMines = tempInputMines;
		solvedCells = 0;
		errorMsg.innerHTML = "";
		errorMsg.style.visibility = "hidden";
		timer.style.background = "black";
		while (minesTable.firstChild) { // reseting the game table
			minesTable.removeChild(minesTable.firstChild);
		}
		clearTimer();
		startGame();
	}
}

function checkGameRequirements(inputWidth, inputMines) {
	if (inputWidth < 7  || 30 < inputWidth) { // check inputWidth range
		displayError("game_width", "Please enter a number between 7 and 30 ...");
	} else if (inputMines < 1 || (inputWidth * inputWidth) <= inputMines) { // check inputMines range
		displayError("game_mines", "Please enter a number between 1 and " + (inputWidth * inputWidth - 1) + " ...");
	} else { // if the values are in range
		return true;
	}
	return false;
}

function startGame() {
	if (mines.length != 0) {
		mines = [];
	}
	status = "playing";
	checkStatus();
	createGameTable();
	createAndPlaceMines();
	addLeadingZerosToNumber(displayNrMines, inputMines);
	tickTack.push(setInterval(startTimer, 1000));
	minesTable.style.cursor = "default";
}

// =========== Timer ==============
function addLeadingZerosToNumber(element, digit) {
	if (digit <= 9) {
		element.innerHTML = "00" + digit;
	} else if (digit <= 99) {
		element.innerHTML = "0" + digit;
	} else {
		element.innerHTML = digit;
	}
}

function startTimer() { // change status to 'lost' if the timer exceeds 10.000 seconds
	addLeadingZerosToNumber(timer, ++seconds);
	if (seconds === 9800) {
		displayError("timer_clock", "!!! Almost 10000 seconds! Hurry up !!!")
	}
	if (seconds >= 10000) {
		status = "lost";
		revealMines("cell_1_1", "#E0E0E0", MINE);
		stopGame();
	}
}

function clearTimer() {
	tickTack.forEach(clearInterval);
	tickTack = [];
	seconds = 0;
}

// =========== Game table ==============
function createGameTable() {
	let	clockBar = getById("clock_bar");
	const CELL_WIDTH = 33;
	clockBar.style.width = (inputRowsCols * CELL_WIDTH) + "px";
	minesTable.style.width = (inputRowsCols * CELL_WIDTH) + "px";
	for (let i = 1; i <= inputRowsCols; ++i) {
		let row = document.createElement("div");
		row.setAttribute("class", "row");
		row.style.gridTemplateColumns = 'repeat('+inputRowsCols + ', 33px';
		row.setAttribute("onContextMenu", "return false");
		for (let j = 1; j <= inputRowsCols; ++j) {
			let cell = document.createElement("div");
			cell.setAttribute("id", setLocation(i, j));
			cell.setAttribute("class", "cell");
			cell.setAttribute("onClick", "clickCell()");
			cell.setAttribute("onContextMenu", "addRemoveFlagOnCell()");
			cell.innerHTML = "";
			row.appendChild(cell);
		}
		minesTable.appendChild(row);
	}	
}

function generateRandomNr(mines) {
	return Math.floor(Math.random() * inputRowsCols + 1);
}

function createAndPlaceMines() {
	if (checkGameRequirements(inputRowsCols, inputMines)) {
		let createMines = inputMines;
		while (createMines > 0) {
			randomMineLocationRow = generateRandomNr(inputMines);
			randomMineLocationCol = generateRandomNr(inputMines);
			let mineLocation = setLocation(randomMineLocationRow, randomMineLocationCol);
			if (!checkIfMineExist(mineLocation)) {
				mines.push(mineLocation);
				--createMines;
			}
		}
	}
}

// ======== Cells functions =========
function clickCell() {
	let clickedLocation = event.srcElement.id;
	if (!flagedCells.includes(clickedLocation) && clickedLocation != "" && status === "playing") {
		markCellAsPressed(clickedLocation);
		if (checkIfMineExist(clickedLocation)) { // check if clicked on a mine
			revealMines(clickedLocation, "red", MINE);
			status = "lost";
			stopGame();
		} else {
			let nrOfNeighbours = checkSurroundingNeighbours(clickedLocation, true);
			if (nrOfNeighbours == 0) {
				expandNeighbourCells(clickedLocation);
			}
			checkforWinner(clickedLocation);
		}
	}
}

function expandNeighbourCells(clickedLocation) { 
	checkSurroundingNeighbours(clickedLocation, false);
	for (let n of surroundingNeighbourCells) {
		if (0 == checkSurroundingNeighbours(n, true)) {
			checkSurroundingNeighbours(n, false);
		}
	}
}

function checkSurroundingNeighbours(location, requestingNrOfNeighbourMines) {
	let countMines = 0;
	let row = getRowAndColFromId(location)[0];
	let col = getRowAndColFromId(location)[1];
	for (let i = row - 1; i <= row + 1 && i <= inputRowsCols; ++i) {
		if (i < 1) { 
			++i;
		}
		for (let j = col - 1; j <= col + 1 && j <= inputRowsCols; ++j) {
			if (j < 1 || i == row && j == col) {
				++j;
			}
			let neighbourCellLocation = setLocation(i, j);
			if (requestingNrOfNeighbourMines && checkIfMineExist(neighbourCellLocation)) {
				++countMines;
			} else if (!requestingNrOfNeighbourMines && !flagedCells.includes(location) 
				&& !surroundingNeighbourCells.includes(neighbourCellLocation) 
				&& 1 <= i && i <= inputRowsCols && 1 <= j && j <= inputRowsCols ) {
				surroundingNeighbourCells.push(neighbourCellLocation);
			}
		}
	}
	if (requestingNrOfNeighbourMines) {
		markCellAsPressed(location);
		if (0 < countMines && !flagedCells.includes(location)) {
			getById(location).innerHTML = designNrOfNeighbours(countMines);
		}
		return countMines;
	}
}

function checkIfMineExist(verifyLocation) {
	for (let mineLocation of mines) {
		if (verifyLocation === mineLocation) {
			return true;
		}
	}
	return false;
}

function designNrOfNeighbours(nr) {
	if (nr === 1) {
		return "<b style='color:blue'>" + nr + "</b>";
	} else if (nr === 2) {
		return "<b style='color:#12C619'>" + nr + "</b>";
	} else if (nr === 3) {
		return "<b style='color:red'>" + nr + "</b>";
	} else if (nr === 4) {
		return "<b style='color:darkblue'>" + nr + "</b>";
	} else if (nr === 5) {
		return "<b style='color:#AB2567'>" + nr + "</b>";
	} else if (nr === 6) {
		return "<b style='color:#22CADD'>" + nr + "</b>";
	} else if (nr === 7) {
		return "<b style='color:083135'>" + nr + "</b>";
	} else {
		return "<b style='color:#6A6D6B'>" + nr + "</b>";
	}
}

function markCellAsPressed(location) {
	if (!visitedCell(location) && !flagedCells.includes(location)) {
		getById(location).style.background = "#E0E0E0";
		getById(location).style.outline = "none";
		++solvedCells;
	}
}

function visitedCell(cellLocation) {
	let cell = getById(cellLocation).style.outline;
	if (cell !== "none") {
		return false;
	}
	return true;
}

function addRemoveFlagOnCell() {
	if (status == "playing") {
		let clickedLocation = event.srcElement.id;
		if (!flagedCells.includes(clickedLocation) && !visitedCell(clickedLocation)) {
			flagedCells.push(clickedLocation);
			getById(clickedLocation).style.backgroundImage = "url(" + FLAG + ")";
			getById(clickedLocation).style.backgroundSize = "25px";
		} else {
			getById(clickedLocation).style.backgroundImage = "none";
			let index = flagedCells.indexOf(clickedLocation);
			flagedCells.splice(index, 1);
		}
	}
}

function getRowAndColFromId(location) {
	let idLength = location.length;
	let row = 0;
	let col = 0;
	for (let i = 5; i < idLength; ++i) {
		if (location[i] != "_" && i < 7) {
			row = stringToDigit(row, location[i]);
		} else if (location[i] != "_") {
			col = stringToDigit(col, location[i]);
		}
	}
	return [row, col];
}

function stringToDigit(rowCol, charNr) {
	return rowCol = rowCol * 10 + Number(charNr);
}

function checkforWinner(location) {
	if (solvedCells == (inputRowsCols * inputRowsCols) - inputMines) {
		errorMsg.setAttribute("class", "animated_winner_message");
		errorMsg.style.visibility = "visible";
		errorMsg.innerHTML = "You Won!";
		getById("settings").style.display = "none";
		status = "won";
		checkStatus();
		revealMines(location, "lightgreen", FLAG);
		stopGame();
	}
}

function revealMines(location, color, IMG_URL) {
	for (let revealMineId of mines) {
		let imgMine = document.createElement("img");
		getById(location).style.background = color;
		imgMine.setAttribute("src", IMG_URL);
		imgMine.setAttribute("width", "25px");
		getById(revealMineId).appendChild(imgMine);
	}
}

function stopGame() {
	minesTable.style.cursor = "not-allowed";
	clearTimer();
	checkStatus();
}
