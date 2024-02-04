// get the material-cost form from the cost-box div
var materialCostForm = document.getElementById("material-costs-input-form");
// get element that will display the estimated cost
var estimatedCostForm = document.getElementById("estimated-costs");



// when the material cost form is submitted, this function is called
// it will calculate the estimated cost of the material by multiplying the cost per unit by the number of units
// it will then display the estimated cost in the material cost select box in the cost-box div
function estimateMaterialCost() {
    var materialName = document.getElementById("material-name").value;
    var costPerUnit = document.getElementById("material-cost-per").value;
    var numberOfUnits = document.getElementById("material-units").value;
    var estimatedCost = costPerUnit * numberOfUnits;
    // create a new option element
    var option = document.createElement("option");
    var optionText = document.createElement("div");
    // set layout of the optiontext to flex, so that the divs will be displayed horizontally
    optionText.style.display = "flex";
    // set the text of the option to the estimated cost
    var optionName = document.createElement("div");
    optionName.textContent = materialName;
    optionText.appendChild(optionName);
    var optionCostPerUnit = document.createElement("div");
    optionCostPerUnit.textContent = costPerUnit;
    optionText.appendChild(optionCostPerUnit);
    var optionNumberOfUnits = document.createElement("div");
    optionNumberOfUnits.textContent = numberOfUnits;
    optionText.appendChild(optionNumberOfUnits);
    var optionEstimatedCost = document.createElement("div");
    optionEstimatedCost.textContent = estimatedCost;
    optionText.appendChild(optionEstimatedCost);
    option.appendChild(optionText);

    // add the option to the material cost select box
    estimatedCostForm.appendChild(option);

    // set the value of the option to the estimated cost
    // option.value = estimatedCost;
    // print to the console for debugging
    console.log("here");
    console.log(option.value);
}

// add an event listener for when the material cost form is submitted that calls the estimateMaterialCost function
materialCostForm.addEventListener("submit", estimateMaterialCost);