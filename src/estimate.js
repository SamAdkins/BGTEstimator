// empty json object that stores all the job types and their prices
var jobTypes = {};

/*
    the total estimation of the job is calculated by adding the total material cost to the total labor cost
*/
var totalEstimation = 0;

/*
    the total material cost is calculated by adding the cost of all materials
*/
var totalMaterialEst = 0;

/*
    the total labor cost is calculated by adding the cost of all labor, multiplied by the labor multiplier
*/
var totalLaborEst = 0;

/*
    the labor multiplier is a number that is multiplied by the total labor cost to account for the vibe of the job
    the labor multiplier is set to 1 by default
*/
var laborMultiplier = 1;

/*
    Material that is currently being created or changed
*/
var currentMaterial = null;

// struct to hold the job type, max price, min price, price, and units
function Job(jobType, maxPrice, minPrice, price, units){
    // auto incrementing id
    this.id = Job.id++;
    this.jobType = jobType;
    this.maxPrice = maxPrice;
    this.minPrice = minPrice;
    this.price = price;
    this.units = units;
    this.totalCost = this.price * this.units;
}

/*
    the id of the job is auto incremented

    the jobList is a json object that stores all the jobs that have been added to the estimated-costs select box
*/
var jobList = {};


// struct representing a surface
function Surface(name, height, width){
    // auto incrementing id
    this.id = Surface.id++;
    this.name = name;
    this.height = height;
    this.width = width;
    this.area = height * width;
}

// struct representing a material
function Material(name, costPer, units){
    // auto incrementing id
    this.id = Material.id++;
    this.name = name;
    this.costPer = costPer;
    this.units = units;
    this.surfaces = {};
    this.totalArea = 0;
    this.totalCost = this.costPer * this.units;
}

// function that cycles through the surfaces in the surfaces json object in a Material object and calculates the total area of the material
// It then adds the total Area to the units of the material
function updateMaterialArea(material){
    var totalArea = 0;
    for (var key in material.surfaces){
        totalArea += material.surfaces[key].area;
    }
    material.units = totalArea;
    material.totalArea = totalArea;
}

// function that adds a new surface to the surfaces json object in a Material object
function addSurface(material, surface){
    material.surfaces[surface.id] = surface;
    updateMaterialArea(material);
}

// function that removes a surface from the surfaces json object in a Material object
function removeSurface(material, surface){
    delete material.surfaces[surface.id];
    updateMaterialArea(material);
}

/*
    the id of the material is auto incremented

    the materialList is a json object that stores all the materials that have been added to the estimated-costs select box
*/
var materialList = {};

// Whenever the jobList, materialList, or laborMultiplier is updated, update the totalEstimation and the estimated-profit span
function updateEstimation(){
    totalEstimation = totalMaterialEst + (totalLaborEst * laborMultiplier);
    $("#total-overall-cost").text("$" + totalEstimation.toFixed(2));
    $("#total-overall-cost").attr("value", totalEstimation.toFixed(2));
    $("#estimated-profit").text("$" + (totalLaborEst - totalMaterialEst).toFixed(2));
    $("#estimated-profit").attr("value", (totalLaborEst - totalMaterialEst).toFixed(2));
    $("#total-labor-estimate").text("$" + (totalLaborEst * laborMultiplier).toFixed(2));
    $("#total-labor-estimate").attr("value", (totalLaborEst * laborMultiplier).toFixed(2));
    $("#total-material-estimate").text("$" + totalMaterialEst.toFixed(2));
    $("#total-material-estimate").attr("value", totalMaterialEst.toFixed(2));
}


// when a csv file is selected, read the file and populate the job-type-datalist with the job types
$(document).ready(function(){
    $("#labor-costs").change(function(){
        // get the file
        var file = document.getElementById("labor-costs").files[0];
        // create a new file reader
        var reader = new FileReader();
        // when the file is loaded, convert the csv file to json
        reader.onload = function(e){
            // get the data from the file
            var data = e.target.result;
            // split the data into an array of lines
            var lines = data.split("\n");
            // convert the array of lines into an array of objects
            var result = [];
            var headers = lines[0].split(",");
            for (var i = 1; i < lines.length; i++){
                var obj = {};
                var currentLine = lines[i].split(",");
                for (var j = 0; j < headers.length; j++){
                    // if the currentline has quotation marks that are not directly preceeded by a number, remove them
                    if (currentLine[j].includes("\"")){
                        var match = currentLine[j].match(/(\d+)\"/);
                        // remove the quotation marks from the string
                        currentLine[j] = currentLine[j].replace(/"/g, '');
                        // find the number that matches the number in match and replace it with the number followed by a quotation mark
                        if (match != null){
                            currentLine[j] = currentLine[j].replace(match[1], match[0]);
                        }
                    }
                    obj[headers[j]] = currentLine[j];
                }
                // if the line item has no price, skip it
                if (obj["Price"] == ""){
                    continue;
                }
                result.push(obj);
            }
            // populate the job-type-datalist with the job types
            for (var i = 0; i < result.length; i++){
                // create a new option with the value of the price and the text of the line item
                newOpt = document.createElement("option");
                var priceString = result[i]["Price"];
                // create a json object with the job type, max price, min price, price, and units
                jobTypes[result[i]["Line Item"]] = {"maxPrice": 0, "minPrice": 0, "price": 0, "units": result[i]["Units"]};

                // if the price is a range, create minPrice and maxPrice attributes for the option
                if (priceString.includes("-")){
                    // remove all spaces from the string
                    priceString = priceString.replace(/\s/g, '');
                    // split the string into an array of the min and max prices
                    var priceArray = priceString.split("-");
                    // if there is a $ in the string, remove it
                    if (priceArray[0].includes("$")){
                        priceArray[0] = priceArray[0].substring(1);
                    }
                    if (priceArray[1].includes("$")){
                        priceArray[1] = priceArray[1].substring(1);
                    }
                    // update the jobtypes json object with the min and max prices
                    jobTypes[result[i]["Line Item"]]["maxPrice"] = priceArray[1];
                    jobTypes[result[i]["Line Item"]]["minPrice"] = priceArray[0];
                    // get the min and max price and convert to a float
                    var minPrice = parseFloat(priceArray[0]);
                    var maxPrice = parseFloat(priceArray[1]);
                    // get the average of the min and max prices
                    var avgPrice = (minPrice + maxPrice) / 2;
                    // round the average price to 2 decimal places
                    avgPrice = avgPrice.toFixed(2);
                    // update the jobtypes json object with the price
                    jobTypes[result[i]["Line Item"]]["Price"] = avgPrice;

                }
                else{ // if the price is a single number, create a price attribute for the option
                    priceString = priceString.substring(1);
                    // update the jobtypes json object with the price
                    jobTypes[result[i]["Line Item"]]["Price"] = priceString;
                }
                newOpt.value = result[i]["Line Item"];
                $("#job-type-datalist").append(newOpt);
            }
        };
        // read the file
        reader.readAsText(file);
    });
});

// when the job-selector input is changed, update the labor-units-label to match the units of the job
$(document).ready(function(){
    $("#job-selector").on("input", function(){
        // get the price of the job from the jobTypes json object
        var jobPrice = jobTypes[$("#job-selector").val()]["Price"];

        console.log("job price: " + jobPrice);
        // get the units of the job from the jobTypes json object
        var jobUnits = jobTypes[$("#job-selector").val()]["Units"];

        // update the labor-units-label to match the units of the job
        $("#lul-span").text(jobUnits);
        // if the jobtype object has a min and max price, update the price slider to match the range of the job, then show the slider
        if (jobTypes[$("#job-selector").val()]["minPrice"] != 0){
            // update the price slider to match the range of the job
            $("#price-slider").attr("min", jobTypes[$("#job-selector").val()]["minPrice"]);
            $("#price-slider").attr("max", jobTypes[$("#job-selector").val()]["maxPrice"]);
            $("#price-slider").attr("value", jobTypes[$("#job-selector").val()]["Price"]);
            // update the price value span to match the price of the job
            $("#price-value").text(jobTypes[$("#job-selector").val()]["Price"]);
            // show the price slider
            $("#price-slider-div").show();
        }
        else{ // if the jobtype object only has a single price, hide the price slider
            $("#price-slider-div").hide();
        }
        // set the value of the labor-units input to 1
        $("#labor-units").val("1");
        // update the total labor cost span
        $("#labor-cost-span").text("$" + jobPrice);

    });
});

// if the labor cost slider is moved, update the labor cost span
$(document).on("input", "#price-slider", function(){
    $("#price-value").text($(this).val());
    // set the price of the job to the value of the slider
    jobTypes[$("#job-selector").val()]["Price"] = $(this).val();
    // set the total labor cost to be the price of the job multiplied by the number of units
    $("#labor-cost-span").text("$" + ($(this).val() * $("#labor-units").val()).toFixed(2));
});

// if the labor units input is changed, update the total labor cost span
$(document).on("input", "#labor-units", function(){
    // get the number of units
    var units = $(this).val();
    // get the price of the labor
    var price = jobTypes[$("#job-selector").val()]["Price"];
    // multiply the price by the number of units
    var totalCost = price * units;
    // round the total cost to 2 decimal places
    totalCost = totalCost.toFixed(2);
    // update the total labor cost span
    $("#labor-cost-span").text("$" + totalCost);
});

// when the vibe slider is moved, update the vibe value span
$(document).on("input", "#vibe-slider", function(){
    $("#vibe-value").text($(this).val());
    $("#vibe-value").attr("value", $(this).val());

    laborMultiplier = $(this).val();

    updateEstimation();
    
    // add an option to the estimated-costs select box
    if ($("#estimated-labor-costs").find("#vibe-cost-adjustment").length == 0){
        $("#estimated-labor-costs").append("<option id='vibe-cost-adjustment' value=" + $(this).val() + ">Multiplier: x" + $(this).val() + " - $" + ($(this).val() * totalLaborEst) + "</option>");
        $("#estimated-labor-costs").attr("size", (parseInt($("#estimated-labor-costs").attr("size")) + 1).toString());
    }
    else{
        $("#estimated-labor-costs").find("#vibe-cost-adjustment").attr("value", $(this).val());
        $("#estimated-labor-costs").find("#vibe-cost-adjustment").text("Multiplier: x" + $(this).val() + " - $" + ($(this).val() * totalLaborEst));
    }
});

// when the add-labor-cost button is clicked, add the labor cost to the estimated-costs select box
$(document).on("click", "#add-labor-cost", function(){
    // get the job type
    var jobType = $("#job-selector").val();
    // get the number of units
    var units = $("#labor-units").val();
    // get the price of the labor
    var price = jobTypes[jobType]["Price"];
    // multiply the price by the number of units
    var totalLaborCost = price * units;
    // round the total cost to 2 decimal places
    totalLaborCost = totalLaborCost.toFixed(2);

    // create a job struct representing the selected job and store it in the jobList array
    var job = new Job(jobType, jobTypes[jobType]["maxPrice"], jobTypes[jobType]["minPrice"], price, units);
    jobList[job.id] = job;

    totalLaborEst += parseFloat(totalLaborCost);

    console.log("total est in add labor: " + totalEstimation.toFixed(2));

    // add the labor cost to the estimated-labor-costs select box
    $("#estimated-labor-costs").append("<option value=" + totalLaborCost + " id=" + job.id + ">" + jobType + " - $" + totalLaborCost + "</option>");
    // increase the size of the estimated-costs select element by 1 to fit the new option
    $("#estimated-labor-costs").attr("size", (parseInt($("#estimated-labor-costs").attr("size")) + 1).toString());
    
    updateEstimation();

});

// when the remove-labor-cost button is clicked, remove the selected cost from the estimated costs select element, and reduce the size by 1
$(document).on("click", ".remove-labor-cost", function(){

    // var multiplier = 1;
    var estimatedProfit = 0;

    // get the id of the selected option
    var id = $("#estimated-labor-costs option:selected").attr("id");

    // if the id of the selected option has the id of vibe-cost-adjustment, set the laborMultiplier to 1
    if (id == "vibe-cost-adjustment"){
        $("#vibe-slider").val(1);
        $("#vibe-value").text(1);
        laborMultiplier = 1;
    }
    else {
        var costToRemove = jobList[id].totalCost;
        totalLaborEst = totalLaborEst - parseFloat(costToRemove);
        console.log("cost to remove: " + costToRemove);
    }
    
    console.log("multiplier: " + laborMultiplier);

    // remove the selected option from the estimated-costs select element
    $("#estimated-labor-costs option:selected").remove();
    // decrease the size of the estimated-costs select element by 1
    $("#estimated-labor-costs").attr("size", (parseInt($("#estimated-labor-costs").attr("size")) - 1).toString());

    updateEstimation();

    // remove the job from the jobList array
    delete jobList[id];
});










// Start Material Cost Estimation Zone VVVVV


// When a material is selected from the estimated-material-costs select box, get the struct representing that material
// and store it as the currentMaterial
$(document).on("change", "#estimated-material-costs", function(){
    currentMaterial = materialList[$("#estimated-material-costs option:selected").attr("id")];
});

// when a material is selected from the material dropdown, update the currentMaterial object to match the selected material
$(document).on("change", "#material-selector", function(){
    var materialName = $("#material-selector").val();
    currentMaterial = new Material(materialName, 0, 0);
});

// function that is passed the input box containing the cost of a material and updates the currentMaterial object to match the cost of material
function updateMaterialCost(costInput){
    var cost = costInput.value;
    console.log("material cost: " + cost);
    currentMaterial.costPer = cost;
}

// function that is passed the input box containing the units of a material and updates the currentMaterial object to match the units of material
function updateMaterialUnits(unitsInput){
    var units = unitsInput.value;
    console.log("material units: " + units);
    currentMaterial.units = units;
}

$(document).ready(function(){
    // function that takes the data from the material-cost-input-form and calculates the estimated cost of all materials
    // and then populates the estimated-costs select box with that information
    // prevent default form submission
    $("input[type='submit']").click(function(){
        event.preventDefault();
        
        // add the currentMaterial to the materialList array
        materialList[currentMaterial.id] = currentMaterial;
        console.log("material list: " + JSON.stringify(materialList));
        totalMaterialEst += currentMaterial.totalCost;

        // create an option with the current material and append it to the estimated-material-costs select box
        newMaterial = document.createElement("option");
        newMaterial.value = currentMaterial.totalCost;
        newMaterial.text = currentMaterial.name + " - $" + currentMaterial.totalCost;
        newMaterial.name = currentMaterial.name;
        newMaterial.id = currentMaterial.id;
        $("#estimated-material-costs").append(newMaterial);
        
        // update the estimations
        updateEstimation();


        // if the material type is tile, calculate the estimated cost of the tile
        // if ($("#tile").is(":checked")){
        //     // get the cost per square foot of the tile
        //     var costSqft = $("#cost-sqft").val();
        //     // get the total area of the job
        //     var totalArea = $("#total-area").attr("value");
        //     // calculate the estimated cost of the tile
        //     var tileCost = costSqft * totalArea;
        //     costToAdd = tileCost;
        //     // round the tile cost to 2 decimal places
        //     tileCost = tileCost.toFixed(2);
        //     // get type of tile
        //     var tileType = $("#tile-type").val();
        //     // add the tile cost to the estimated-costs select box
        //     if (tileType == ""){
        //         // modify so value is unique or id is unique
        //         $("#estimated-material-costs").append("<option name='tile' value=" + tileCost + ">Tile - $" + tileCost + "</option>");

        //     }
        //     else{
        //         $("#estimated-material-costs").append("<option name='tile' value=" + tileCost +">Tile - " + tileType + " - $" + tileCost + "</option>");
        //     }
        //     // increase the size of the estimated-costs select element by 1 to fit the new option
        //     $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        // }
        // else if ($("#other-material").is(":checked")){
        //     var materialName = $("#material-name").val();
        //     var materialCostPer = $("#material-cost-per").val();
        //     var materialUnits = $("#material-units").val();
        //     var materialCost = materialCostPer * materialUnits;
        //     costToAdd = materialCost;
        //     var materialCostString = materialName + " - $" + materialCost.toFixed(2);
        //     $("#estimated-material-costs").append("<option name='other' value=" + materialCost.toFixed(2) +">" + materialCostString + "</option>");
        //     // increase the size of the estimated-costs select element by 1 to fit the new option
        //     $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        // }
        // else if ($("#grout").is(":checked")){
        //     var groutCost = $("#grout-cost").val();
        //     var groutUnits = $("#grout-units").val();
        //     costToAdd = groutCost * groutUnits;
        //     var groutCostString = "Grout - $" + ((groutCost * groutUnits).toFixed(2));
        //     $("#estimated-material-costs").append("<option name='grout' value=" + (groutCost * groutUnits) +">" + groutCostString + "</option>");
        //     // increase the size of the estimated-costs select element by 1 to fit the new option
        //     $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        // }
        // else if ($("#caulk").is(":checked")){
        //     var caulkCost = $("#caulk-cost").val();
        //     var caulkUnits = $("#caulk-units").val();
        //     costToAdd = caulkCost * caulkUnits;
        //     var caulkCostString = "Caulk - $" + ((caulkCost * caulkUnits).toFixed(2));
        //     $("#estimated-material-costs").append("<option name='caulk' value=" + (caulkCost * caulkUnits) + ">" + caulkCostString + "</option>");
        //     // increase the size of the estimated-costs select element by 1 to fit the new option
        //     $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        // }
        // else if ($("#sealant").is(":checked")){
        //     var sealantCost = $("#sealant-cost").val();
        //     var sealantUnits = $("#sealant-units").val();
        //     costToAdd = sealantCost * sealantUnits;
        //     var sealantCostString = "Color Seal - $" + ((sealantCost * sealantUnits).toFixed(2));
        //     $("#estimated-material-costs").append("<option name='sealant' value=" + (sealantCost * sealantUnits) + ">" + sealantCostString + "</option>");
        //     // increase the size of the estimated-costs select element by 1 to fit the new option
        //     $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        // }

        // totalMaterialEst += costToAdd;
        // totalEstimation = totalMaterialEst + totalLaborEst;
        // update the total cost paragraph
        // $("#total-overall-cost").text("$" + totalEstimation.toFixed(2));

        // // update the total-material-estimate span
        // $("#total-material-estimate").text("$" + totalMaterialEst.toFixed(2));

        // // update estimated profit span
        // $("#estimated-profit").text("$" + (totalLaborEst - totalMaterialEst).toFixed(2));
        // $("#estimated-profit").attr("value", (totalLaborEst - totalMaterialEst).toFixed(2));

        // reset all form inputs
        $("#material-costs-input-form").trigger("reset");
        $("#surface-table tbody").empty();
        $("#total-area").attr("value", "0");
        $("#total-area").text("0");
        $("#caulk-cost").val("");
        $("#caulk-units").val("");
        $("#sealant-cost").val("");
        $("#sealant-units").val("");
        $("#grout-cost").val("");
        $("#grout-units").val("");
        $("#cost-sqft").val("");
        $("#material-name").val("");
        $("#material-cost-per").val("");
        $("#material-units").val("");
        $("#surface-name").val("");
        $("#surface-height").val("");
        $("#surface-width").val("");
        $("#tile-type").val("");
        $("#vibe-slider").val(1);
        $("#vibe-value").text(1);

        
    });
});


// function that adds a new row to the surface table
// the row contains the surface name, height, width, and area
// the area is calculated by multiplying the height and width
$(document).ready(function(){
    $("#add-surfaces").click(function(){
        var surfaceName = $("#surface-name").val();
        var surfaceHeight = $("#surface-height").val();
        var surfaceWidth = $("#surface-width").val();
        var surfaceArea = surfaceHeight * surfaceWidth;
        // round the tile area to 3 decimal places
        surfaceArea = surfaceArea.toFixed(3);

        // create a new surface struct and store it in the currentMaterial object
        var surface = new Surface(surfaceName, surfaceHeight, surfaceWidth);
        addSurface(currentMaterial, surface);

        // create a button that will remove the row from the table when clicked
        var removeButton = "<button id=" + surface.id + " class='remove-surface-button rounded-sm bg-bgt-blue p-1 text-white hover:bg-bgt-dark-blue'>Remove</button>";
        // add the new row to the surface table with the surface name, height, width, area, and remove button
        $("#surface-table").append("<tr><td>" + surfaceName + "</td><td>" + surfaceHeight + "</td><td>" + surfaceWidth + "</td><td>" + surfaceArea + "</td><td>" + removeButton + "</td></tr>");
        // add the area of the new surface to the total area and update the total area span
        var totalArea = currentMaterial.totalArea;

        $("#total-area").attr("value", (totalArea).toString());
        $("#total-area").text($("#total-area").attr("value"));
        // clear the input fields
        $("#surface-name").val("");
        $("#surface-height").val("");
        $("#surface-width").val("");

    });
});

// when the remove button is clicked in the surface table, remove the row from the table
// and subtract the area of the surface from the total area
$(document).on("click", ".remove-surface-button", function(){
    // get the area of the surface that is being removed
    // var surfaceArea = currentMaterial.surfaces[$(this).attr("id")].area;
    // var surfaceArea = $(this).parent().prev().text();

    // remove the surface from the currentMaterial object
    removeSurface(currentMaterial, currentMaterial.surfaces[$(this).attr("id")]);
    var totalArea = currentMaterial.totalArea;

    // subtract the area of the surface from the total area
    $("#total-area").attr("value", (totalArea).toString());
    // round the total area to 3 decimal places
    $("#total-area").attr("value", totalArea.toFixed(3));
    $("#total-area").text($("#total-area").attr("value"));
    // remove the row from the table
    $(this).parent().parent().remove();
});

// when the remove-cost button is clicked, remove the selected cost from the estimated costs select element, and reduce the size by 1
$(document).on("click", ".remove-material-cost", function(){

    // get the id of the selected option
    var id = $("#estimated-material-costs option:selected").attr("id");
    var costToRemove = materialList[id].totalCost;
    totalMaterialEst = totalMaterialEst - parseFloat(costToRemove);
    console.log("cost to remove: " + costToRemove);

    // remove the selected option from the estimated-costs select element
    $("#estimated-material-costs option:selected").remove();
    // decrease the size of the estimated-costs select element by 1
    $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) - 1).toString());

    updateEstimation();


    // var costToRemove = document.querySelector("#estimated-material-costs").value;
    // // remove the selected option from the estimated-costs select element
    // $("#estimated-material-costs option:selected").remove();
    // // decrease the size of the estimated-costs select element by 1
    // $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) - 1).toString());

    // totalMaterialEst -= parseFloat(costToRemove);
    // totalEstimation = totalMaterialEst + totalLaborEst;
    // // update the total cost paragraph
    // $("#total-overall-cost").text("$" + totalEstimation.toFixed(2));
    // $("#total-material-estimate").text("$" + totalMaterialEst.toFixed(2));

    // // update estimated profit span
    // $("#estimated-profit").text("$" + (totalLaborEst - totalMaterialEst).toFixed(2));
    // $("#estimated-profit").attr("value", (totalLaborEst - totalMaterialEst).toFixed(2));
});



// When an option in the estimated-labor-costs select box is selected check the job type option from the job-type-datalist and update the labor cost and units
// $(document).on("change", "#estimated-labor-costs", function(){
//     var cost = $("#estimated-labor-costs option:selected").attr("value");
//     var jobType = $("#estimated-labor-costs option:selected").text();
//     var jobType = jobType.split(" - $")[0];
//     var jobType = jobType.split(" - x")[0];
//     var jobType = jobType.split(" - ")[0];









// PDF Generation Zone VVVVVVVV



// when the generate pdf button is clicked, open a new tab with the pdf layout of the estimator's breakddown.
// send the information from the estimator to the pdf layout
$(document).ready(function(){   
    $("#generate-pdf").click(function(){
        // get the job type
        var jobType = "";
        if ($("#installation").is(":checked")){
            jobType += "Installation ";
        }
        if ($("#replacement").is(":checked")){
            jobType += "Replacement ";
        }
        if ($("#cleaning").is(":checked")){
            jobType += "Cleaning ";
        }
        if ($("#sealing").is(":checked")){
            jobType += "Sealing ";
        }
        if ($("#regrout").is(":checked")){
            jobType += "Re-grouting ";
        }
        if ($("#recaulk").is(":checked")){
            jobType += "Re-caulking ";
        }
        if ($("#other-job").is(":checked")){
            jobType += "Other ";
        }
        // get the total cost
        var totalCost = $("#total-overall-cost").text();
        // get the material costs   
        var materialCosts = "";
        $("#estimated-material-costs option").each(function(){
            materialCosts += $(this).text() + ", ";
        });
        // get the labor costs
        var laborCosts = "";
        // open the Print-Estimation.html page in a new tab and save the estimation information to local storage so it can be accessed from the new tab
        var newWindow = window.open("Print-Estimation.html", "_blank");
        localStorage.setItem("jobType", jobType);
        localStorage.setItem("totalCost", totalCost);
        localStorage.setItem("materialCosts", materialCosts);
        localStorage.setItem("laborCosts", laborCosts);

    });
});
