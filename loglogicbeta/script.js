/////////////////////////////////////////
//////////////// Swipe Logic ////////////
/////////////////////////////////////////

let container1 = document.getElementById("history");
let container2 = document.getElementById("display");
let container3 = document.getElementById("display2");

let containers = [container1, container2, container3];

// Define variables for startX, diffX
let startX = 0;
let diffX = 0;

// Define the elements you want to manipulate
let mode1 = document.getElementById("mode1");
let mode2 = document.getElementById("mode2");

// Function to handle touch start
function handleTouchStart(e) {
    startX = e.touches[0].clientX;
}

// Function to handle touch end
function handleTouchEnd(e) {
    let endX = e.changedTouches[0].clientX;
    diffX = endX - startX;

    if (diffX > 50) {
        // Right swipe
        mode2.classList.add("slide-right");
        mode2.classList.remove("slide-middle");
        mode1.classList.add("slide-middle");
        mode1.classList.remove("slide-left");
    } else if (diffX < -50) {
        // Left swipe
        Display2.value = parseFloat(totalVolume.toFixed(3));
        mode1.classList.add("slide-left");
        mode1.classList.remove("slide-middle");
        mode2.classList.add("slide-middle");
        mode2.classList.remove("slide-right");
    }
}

// Attach event listeners to each container
containers.forEach(container => {
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
});


/////////////////////////////////////////
//////////////// Mode 1 /////////////////
/////////////////////////////////////////

//Global variables
let IsReset = true;
let CheckSymbol = true;
let totalPieces = 0;
let totalVolume = 0;
let Display = document.getElementById("display");
let history = document.getElementById("history");

const buttons = document.querySelectorAll("#keypad button");

function triggerVibration() {
  if (navigator.vibrate) {
    navigator.vibrate(50); // Vibrate for 50ms
  }
}

buttons.forEach((button) => {
  button.addEventListener("touchstart", function () {
    button.classList.add("touch-active");
    triggerVibration();
  });

  button.addEventListener("touchend", function () {
    button.classList.remove("touch-active");
  });

  button.addEventListener("touchcancel", function () {
    button.classList.remove("touch-active");
  });
});

Display.addEventListener("input", (e) => {
  validateState();
  scrollDisplayToRight();

  if (IsReset) {
    let newValue = e.target.value;
    Display.value = newValue.substring(1);
    IsReset = false;
  }
});

// Functions Declarations
function validateState() {
  if (Display.value === "") {
    Display.value = 0;
    IsReset = true;
    console.log(`${IsReset}`);
  }

  let lastCharacter = getLastCharacter(Display.value);
  CheckSymbol = !MathOperators.includes(lastCharacter);
}

function display(num) {
  let shouldReplaceNumberZero = Display.value === "0";
  Display.value = shouldReplaceNumberZero ? num : Display.value + num;
  CheckSymbol = true;
  IsReset = false;
  scrollDisplayToRight();
}

function reset() {
  Display.value = 0;
  CheckSymbol = true;
  IsReset = true;
}

function resetEntry() {
  var outputList = document.getElementById("historyList");
  outputList.innerHTML = "";
  reset();
  totalPieces = 0;
  totalVolume = 0;
  updateTotal(0, 0);
}

function removeCharacter() {
  const endIndex = Display.value.length - 1;
  Display.value = Display.value.slice(0, endIndex);
  validateState();
}

function getLastCharacter(text) {
  return text.slice(-1);
}

function scrollDisplayToRight() {
  Display.scrollLeft = Display.scrollWidth;
}

function scrollFunction() {
  const element = document.getElementById("historyList");
  element.scrollIntoView({ block: "end" });
}

function scrollDisplayToBeginning() {
  Display.scrollLeft = 0;
}

function formatNumber() {
  var input = Display.value;
  var outputList = document.getElementById("historyList");

  var listItem = document.createElement("li");

  var firstSlice = parseInt(input.slice(0, -1));
  var secondSlice = parseInt(input.slice(-1));
  var vol = (firstSlice * firstSlice * secondSlice) / 2304;

  var div1 = document.createElement("div");
  div1.textContent = input.slice(0, -1) + '" x ' + input.slice(-1) + "'";
  div1.classList.add("history-item");
  listItem.appendChild(div1);

  var div2 = document.createElement("div");
  div2.textContent = vol.toFixed(3) + " cft";
  div2.classList.add("history-item");
  listItem.appendChild(div2);

  var div3 = document.createElement("div");
  div3.textContent = "X";
  div3.classList.add("history-item", "delete");
  div3.addEventListener("click", function () {
    // Call a function to remove the corresponding row
    listItem.remove();
    // Update total pieces and volume accordingly
    totalPieces--;
    totalVolume -= vol;
    updateTotal(totalPieces, totalVolume);
  });
  listItem.appendChild(div3);

  reset();
  if (input != "0" && input.length > 1) {
    outputList.appendChild(listItem);
    totalPieces++;
    totalVolume += vol;
    updateTotal(totalPieces, totalVolume);
    scrollFunction();
  }
}

function updateTotal(totalPieces, totalVolume) {
  var totalPieceElement = document.getElementById("piece");
  var totalVolumeElement = document.getElementById("volume");

  totalPieceElement.textContent = totalPieces + " pcs";
  totalVolumeElement.textContent = totalVolume.toFixed(3) + " cft";
}

/////////////////////////////////////////
//////////////// Mode 2 /////////////////
/////////////////////////////////////////

//Global variables
const MathOperators = ["+", "-", "*", "/"];

let IsReset2 = true;
let CheckSymbol2 = true;
let Display2 = document.getElementById("display2");

const buttons2 = document.querySelectorAll("#keypad2 button");

buttons2.forEach((button) => {
  button.addEventListener("touchstart", function () {
    button.classList.add("touch-active");
    triggerVibration();
  });

  button.addEventListener("touchend", function () {
    button.classList.remove("touch-active");
  });

  button.addEventListener("touchcancel", function () {
    button.classList.remove("touch-active");
  });
});

Display2.addEventListener("input", (e) => {
  validateState2();
  scrollDisplayToRight2();

  if (IsReset2) {
    let newValue = e.target.value;
    Display2.value = newValue.substring(1);
    IsReset2 = false;
  }
});

// Functions Declarations
function validateState2() {
  if (Display2.value === "") {
    Display2.value = 0;
    IsReset2 = true;
    console.log(`${IsReset2}`);
  }

  let lastCharacter = getLastCharacter(Display2.value);
  CheckSymbol2 = !MathOperators.includes(lastCharacter);
}

function display2(num) {
  let shouldReplaceNumberZero = Display2.value === "0";
  Display2.value = shouldReplaceNumberZero ? num : Display2.value + num;
  CheckSymbol2 = true;
  IsReset2 = false;
  scrollDisplayToRight2();
}

function calculate() {
  try {
    compute = Display2.value;
    let result = eval(compute);
    let roundResult = Math.round(result * 100000000) / 100000000; // 8 percision
    Display2.value = parseFloat(roundResult.toFixed(2));
    validateState2();
  } catch (err) {
    alert(err);
  }

  scrollDisplayToBeginning2();
}

function reset2() {
  Display2.value = 0;
  CheckSymbol2 = true;
  IsReset2 = true;
}

function removeCharacter2() {
  const endIndex = Display2.value.length - 1;
  Display2.value = Display2.value.slice(0, endIndex);
  validateState2();
}

function getLastCharacter(text) {
  return text.slice(-1);
}

function getLastMathOperatorIndex(text) {
  const regex = /(?:\+|\-|\*|\/)(?!.*(?:\+|\-|\*|\/))/;
  return regex.exec(text)?.index;
}

function scrollDisplayToRight2() {
  Display2.scrollLeft = Display2.scrollWidth;
}

function scrollDisplayToBeginning2() {
  Display2.scrollLeft = 0;
}

function setCharAt(str, index, chr) {
  if (index > str.length - 1) {
    return str;
  }

  return str.substring(0, index) + chr + str.substring(index + 1);
}

function addCharAt(str, index, chr) {
  if (index > str.length - 1) {
    return str;
  }

  let a = str.slice(0, index);
  let b = chr;
  let c = str.slice(index, str.length);

  return a + b + c;
}
