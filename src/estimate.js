// empty json object that stores all the job types and their prices
var jobTypes = {};
var totalEstimation = 0;
var totalMaterialEst = 0;
var totalLaborEst = 0;
// var laborMultiplier = 1;

// struct to hold the job type, max price, min price, price, and units
function Job(jobType, maxPrice, minPrice, price, units){
    // auto incrementing id
    this.id = Job.id++;
    this.jobType = jobType;
    this.maxPrice = maxPrice;
    this.minPrice = minPrice;
    this.price = price;
    this.units = units;
}

var jobList = [];


// struct representing a surface
function Surface(name, height, width){
    this.name = name;
    this.height = height;
    this.width = width;
}

// struct representing a material
function Material(name, costPer, units){
    // auto incrementing id
    this.id = Material.id++;
    this.name = name;
    this.costPer = costPer;
    this.units = units;
    this.surfaces = [];
}

var materialList = [];


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
    jobList.push(job);

    totalLaborEst += parseFloat(totalLaborCost);
    totalEstimation += parseFloat(totalLaborCost);

    console.log("total est in add labor: " + totalEstimation.toFixed(2));
    // update the total cost paragraph
    $("#total-overall-cost").text("$" + totalEstimation);
    $("#total-overall-cost").attr("value", totalEstimation);
    // add the labor cost to the estimated-labor-costs select box
    $("#estimated-labor-costs").append("<option value=" + totalLaborCost + " id=" + job.id + ">" + jobType + " - $" + totalLaborCost + "</option>");
    // increase the size of the estimated-costs select element by 1 to fit the new option
    $("#estimated-labor-costs").attr("size", (parseInt($("#estimated-labor-costs").attr("size")) + 1).toString());
    // // update total-labor-estimate span
    $("#total-labor-estimate").text("$" + totalLaborEst.toFixed(2));
    
    // update estimated profit span
    $("#estimated-profit").text("$" + (totalLaborEst - totalMaterialEst).toFixed(2));
    $("#estimated-profit").attr("value", (totalLaborEst - totalMaterialEst).toFixed(2));

});

// when the remove-labor-cost button is clicked, remove the selected cost from the estimated costs select element, and reduce the size by 1
$(document).on("click", ".remove-labor-cost", function(){

    var multiplier = 1;
    var estimatedProfit = 0;

    // get the id of the selected option
    var id = $("#estimated-labor-costs option:selected").attr("id");

    // if the selected option has the id of vibe-cost-adjustment, remove the multiplier from the total labor cost
    if ($("#estimated-labor-costs option:selected").attr("id") != "vibe-cost-adjustment"){
        if ($("#vibe-slider").val() != 1){
            multiplier = $("#vibe-value").val();
        }
        // multiplier = $("#vibe-value").val();
        var costToRemove = document.querySelector("#estimated-labor-costs").value;
        totalLaborEst = totalLaborEst - parseFloat(costToRemove);
        console.log("cost to remove: " + costToRemove);
    }
    else{
        // set the vibe slider to 1
        $("#vibe-slider").val(1);
        $("#vibe-value").text(1);
    }
    
    console.log("multiplier: " + multiplier);

    // remove the selected option from the estimated-costs select element
    $("#estimated-labor-costs option:selected").remove();
    // decrease the size of the estimated-costs select element by 1
    $("#estimated-labor-costs").attr("size", (parseInt($("#estimated-labor-costs").attr("size")) - 1).toString());

    totalEstimation = totalMaterialEst + (totalLaborEst * multiplier);
    estimatedProfit = (totalLaborEst * multiplier) - totalMaterialEst;

    // update the total cost paragraph
    $("#total-overall-cost").text("$" + totalEstimation.toFixed(2));
    $("#total-labor-estimate").text("$" + totalLaborEst.toFixed(2));

    // update estimated profit span
    $("#estimated-profit").text("$" + estimatedProfit.toFixed(2));
    $("#estimated-profit").attr("value", estimatedProfit.toFixed(2));
});










// Start Material Cost Estimation Zone VVVVV



$(document).ready(function(){
    // function that takes the data from the material-cost-input-form and calculates the estimated cost of all materials
    // and then populates the estimated-costs select box with that information
    // prevent default form submission
    $("input[type='submit']").click(function(){
        event.preventDefault();
        var costToAdd = 0;
        // if the material type is tile, calculate the estimated cost of the tile
        if ($("#tile").is(":checked")){
            // get the cost per square foot of the tile
            var costSqft = $("#cost-sqft").val();
            // get the total area of the job
            var totalArea = $("#total-area").attr("value");
            // calculate the estimated cost of the tile
            var tileCost = costSqft * totalArea;
            costToAdd = tileCost;
            // round the tile cost to 2 decimal places
            tileCost = tileCost.toFixed(2);
            // get type of tile
            var tileType = $("#tile-type").val();
            // add the tile cost to the estimated-costs select box
            if (tileType == ""){
                // modify so value is unique or id is unique
                $("#estimated-material-costs").append("<option name='tile' value=" + tileCost + ">Tile - $" + tileCost + "</option>");

            }
            else{
                $("#estimated-material-costs").append("<option name='tile' value=" + tileCost +">Tile - " + tileType + " - $" + tileCost + "</option>");
            }
            // increase the size of the estimated-costs select element by 1 to fit the new option
            $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        }
        else if ($("#other-material").is(":checked")){
            var materialName = $("#material-name").val();
            var materialCostPer = $("#material-cost-per").val();
            var materialUnits = $("#material-units").val();
            var materialCost = materialCostPer * materialUnits;
            costToAdd = materialCost;
            var materialCostString = materialName + " - $" + materialCost.toFixed(2);
            $("#estimated-material-costs").append("<option name='other' value=" + materialCost.toFixed(2) +">" + materialCostString + "</option>");
            // increase the size of the estimated-costs select element by 1 to fit the new option
            $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        }
        else if ($("#grout").is(":checked")){
            var groutCost = $("#grout-cost").val();
            var groutUnits = $("#grout-units").val();
            costToAdd = groutCost * groutUnits;
            var groutCostString = "Grout - $" + ((groutCost * groutUnits).toFixed(2));
            $("#estimated-material-costs").append("<option name='grout' value=" + (groutCost * groutUnits) +">" + groutCostString + "</option>");
            // increase the size of the estimated-costs select element by 1 to fit the new option
            $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        }
        else if ($("#caulk").is(":checked")){
            var caulkCost = $("#caulk-cost").val();
            var caulkUnits = $("#caulk-units").val();
            costToAdd = caulkCost * caulkUnits;
            var caulkCostString = "Caulk - $" + ((caulkCost * caulkUnits).toFixed(2));
            $("#estimated-material-costs").append("<option name='caulk' value=" + (caulkCost * caulkUnits) + ">" + caulkCostString + "</option>");
            // increase the size of the estimated-costs select element by 1 to fit the new option
            $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        }
        else if ($("#sealant").is(":checked")){
            var sealantCost = $("#sealant-cost").val();
            var sealantUnits = $("#sealant-units").val();
            costToAdd = sealantCost * sealantUnits;
            var sealantCostString = "Color Seal - $" + ((sealantCost * sealantUnits).toFixed(2));
            $("#estimated-material-costs").append("<option name='sealant' value=" + (sealantCost * sealantUnits) + ">" + sealantCostString + "</option>");
            // increase the size of the estimated-costs select element by 1 to fit the new option
            $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) + 1).toString());
        }

        totalMaterialEst += costToAdd;
        totalEstimation = totalMaterialEst + totalLaborEst;
        // update the total cost paragraph
        $("#total-overall-cost").text("$" + totalEstimation.toFixed(2));

        // update the total-material-estimate span
        $("#total-material-estimate").text("$" + totalMaterialEst.toFixed(2));

        // update estimated profit span
        $("#estimated-profit").text("$" + (totalLaborEst - totalMaterialEst).toFixed(2));
        $("#estimated-profit").attr("value", (totalLaborEst - totalMaterialEst).toFixed(2));

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
        // create a button that will remove the row from the table when clicked
        var removeButton = "<button class='remove-surface-button rounded-sm bg-bgt-blue p-1 text-white hover:bg-bgt-dark-blue'>Remove</button>";
        // add the new row to the surface table with the surface name, height, width, area, and remove button
        $("#surface-table").append("<tr><td>" + surfaceName + "</td><td>" + surfaceHeight + "</td><td>" + surfaceWidth + "</td><td>" + surfaceArea + "</td><td>" + removeButton + "</td></tr>");
        // add the area of the new surface to the total area and update the total area span
        var totalArea = $("#total-area").attr("value");
        totalArea = parseFloat(totalArea);
        totalArea += parseFloat(surfaceArea);
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
    var surfaceArea = $(this).parent().prev().text();
    // subtract the area of the surface from the total area
    $("#total-area").attr("value", (parseFloat($("#total-area").attr("value")) - surfaceArea).toString());
    // round the total area to 3 decimal places
    $("#total-area").attr("value", parseFloat($("#total-area").attr("value")).toFixed(3));
    $("#total-area").text($("#total-area").attr("value"));
    // remove the row from the table
    $(this).parent().parent().remove();
});

// when the remove-cost button is clicked, remove the selected cost from the estimated costs select element, and reduce the size by 1
$(document).on("click", ".remove-material-cost", function(){
    var costToRemove = document.querySelector("#estimated-material-costs").value;
    // remove the selected option from the estimated-costs select element
    $("#estimated-material-costs option:selected").remove();
    // decrease the size of the estimated-costs select element by 1
    $("#estimated-material-costs").attr("size", (parseInt($("#estimated-material-costs").attr("size")) - 1).toString());

    totalMaterialEst -= parseFloat(costToRemove);
    totalEstimation = totalMaterialEst + totalLaborEst;
    // update the total cost paragraph
    $("#total-overall-cost").text("$" + totalEstimation.toFixed(2));
    $("#total-material-estimate").text("$" + totalMaterialEst.toFixed(2));

    // update estimated profit span
    $("#estimated-profit").text("$" + (totalLaborEst - totalMaterialEst).toFixed(2));
    $("#estimated-profit").attr("value", (totalLaborEst - totalMaterialEst).toFixed(2));
});

// when the vibe slider is moved, update the vibe value span
$(document).on("input", "#vibe-slider", function(){
    $("#vibe-value").text($(this).val());
    $("#vibe-value").attr("value", $(this).val());
    // multiply the total estimated labor cost by the value of the slider
    // console.log("total labor est: " + totalLaborEst);
    // console.log("vibe value: " + $(this).val());
    // // totalLaborEst = totalLaborEst * $(this).val();
    // console.log("total labor est after: " + totalLaborEst * $(this).val());
    // totalLaborEst *= $(this).val();
    
    totalEstimation = totalMaterialEst + (totalLaborEst * $(this).val());
    // update the total cost paragraph
    $("#total-overall-cost").text("$" + totalEstimation.toFixed(2));
    // update total labor estimate span
    $("#total-labor-estimate").text("$" + (totalLaborEst * $(this).val()).toFixed(2));
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

// When an option in the estimated-labor-costs select box is selected check the job type option from the job-type-datalist and update the labor cost and units
$(document).on("change", "#estimated-labor-costs", function(){
    var cost = $("#estimated-labor-costs option:selected").attr("value");
    var jobType = $("#estimated-labor-costs option:selected").text();
    var jobType = jobType.split(" - $")[0];
    var jobType = jobType.split(" - x")[0];
    var jobType = jobType.split(" - ")[0];









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
