
// Constants
const urlJSONByColumn = '/static/DatasetManipulations/truncated_nursing_df2.json';
const urlJSONByRow = '/static/DatasetManipulations/truncated_nursing_df2_by_record.json';
const urlJSONCorrelationsByRow = '/static/DatasetManipulations/correlations_df_by_record.json';
const colors = ['#a0d', '#b6a', '#e87', '#ed3', '#c0ee11', '#6f0'];
const listOfTruncatedNursingDataFrameColumns = ['Federal Provider Number', 'Provider Name',
'Provider City', 'Provider State', 'Provider Zip Code', 'Provider County Name',
'Ownership Type', 'Number Of Certified Beds', 'Number Of Residents In Certified Beds',
'Provider Type', 'Provider Resides In Hospital',
'Most Recent Health Inspection More Than 2 Years Ago',
'Automatic Sprinkler Systems In All Required Areas', 'Overall Rating',
'Health Inspection Rating', 'Staffing Rating', 'RN Staffing Rating',
'Total Weighted Health Survey Score', 'Number Of Facility Reported Incidents',
'Number Of Substantiated Complaints', 'Number Of Fines',
'Total Amount Of Fines In Dollars', 'Number Of Payment Denials',
'Total Number Of Penalties', 'Location', 'Processing Date', 'Latitude',
'Adjusted Total Nurse Staffing Hours Per Resident Per Day', 'Longitude'];
const isRangeCategory = ['Provider Zip Code','Number Of Certified Beds', 'Number Of Residents In Certified Beds',
'Overall Rating','Health Inspection Rating', 'Staffing Rating', 'RN Staffing Rating',
'Total Weighted Health Survey Score', 'Number Of Facility Reported Incidents',
'Number Of Substantiated Complaints', 'Number Of Fines',
'Total Amount Of Fines In Dollars', 'Number Of Payment Denials',
'Total Number Of Penalties','Latitude',
'Adjusted Total Nurse Staffing Hours Per Resident Per Day', 'Longitude'];
const centerOfUSA = [ 37, -100 ];

// Declared Variables
let dropDownMenuValue;
let categoryCount = 0;
let categoryPanelList = [];
let myMap;
let listOfWeightedCategories;
let doughnutChartWeightedTotals;
let correleationsCategoryChart;
let groupCategoryWeightsChart;
let alreadyPopulated = false;


// Global variables to hold a deep copy of retrieved data
let dataByColumn = null;
let dataByRow = null;
let correlationsByRow = null;
let topXRecords = [];
let topXRecordColumns = [];


// Calculations ****************************
function isDollarAmount(value) {
    const regex = /^\$\d+(\.\d{2})?$/;
    return regex.test(value);
}


// Calculate Weighted Totals and check if the values can converted to numerical values eg
// the 'TX' is not converted but the value '$5.87' is converted
function getWeightedTotals(listOfWeightedCategories, dataColumns, recordSpecificWeightTypes) {
    let recordIndicesAndWeights = {};

    if (dataColumns != null) {
        for (let i = 0; i < Object.keys(dataColumns['Federal Provider Number']).length; i++) {
            let totalRecordWeight = 0;

            for (let j = 0; j < listOfWeightedCategories.length; j++) {
                if (listOfWeightedCategories[j]['range_All'] == 'range') {
                    if (dataColumns[listOfWeightedCategories[j]['category']][i] && String(dataColumns[listOfWeightedCategories[j]['category']][i])) {//check if not null
                        if (isDollarAmount(dataColumns[listOfWeightedCategories[j]['category']][i])) {
                            if (recordSpecificWeightTypes) {
                                listOfWeightedCategories[j]['topXWeightedValues'].push(parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i].replace('$', "")) * parseFloat(listOfWeightedCategories[j]['weight']));
                            } else {
                                totalRecordWeight += parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i].replace('$', "")) * parseFloat(listOfWeightedCategories[j]['weight']);
                            }
                        } else {
                            if (recordSpecificWeightTypes) {
                                listOfWeightedCategories[j]['topXWeightedValues'].push(parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i]) * parseFloat(listOfWeightedCategories[j]['weight']));
                            } else {
                                totalRecordWeight += parseFloat(dataColumns[listOfWeightedCategories[j]['category']][i]) * parseFloat(listOfWeightedCategories[j]['weight']);
                            }
                        }
                    }
                } else {
                    if (String(dataColumns[listOfWeightedCategories[j]['category']][i]) == String(listOfWeightedCategories[j]['value'])) {

                        if (recordSpecificWeightTypes) {
                            listOfWeightedCategories[j]['topXWeightedValues'].push(parseFloat(listOfWeightedCategories[j]['weight']));
                        } else {
                            totalRecordWeight += parseFloat(listOfWeightedCategories[j]['weight']);
                        }
                    }
                }
            }
            recordIndicesAndWeights[i] = totalRecordWeight;
        }
    }
    return recordIndicesAndWeights;
}


// Get Records by Indices
function getRecordsByIndices(indicesAndTotalsForTopX) {
    topXRecords = [];
    topXRecordColumns['totalWeightedScore'] = [];
    topXRecordColumns['index'] = [];
    for (let h = 0; h < listOfTruncatedNursingDataFrameColumns.length; h++) {
        topXRecordColumns[listOfTruncatedNursingDataFrameColumns[h]] = [];
    }
    if (dataByColumn) {
        for (let i = 0; i < indicesAndTotalsForTopX.length; i++) {
            let recordDict = {};
            let index = parseInt(indicesAndTotalsForTopX[i][0]);
            let totalWeight = indicesAndTotalsForTopX[i][1];
            recordDict['index'] = index;
            topXRecordColumns['index'].push(index);
            recordDict['totalWeightedScore'] = totalWeight;
            topXRecordColumns['totalWeightedScore'].push(totalWeight);
            for (let j = 0; j < listOfTruncatedNursingDataFrameColumns.length; j++) {
                recordDict[listOfTruncatedNursingDataFrameColumns[j]] = dataByColumn[listOfTruncatedNursingDataFrameColumns[j]][index];
                topXRecordColumns[listOfTruncatedNursingDataFrameColumns[j]].push(dataByColumn[listOfTruncatedNursingDataFrameColumns[j]][index]);
            }
            topXRecords.push(recordDict);
        }
    }

    // console.log(topXRecordColumns);
    // console.log(JSON.stringify(topXRecordColumns));
    // console.log(topXRecords);
    // console.log(JSON.stringify(topXRecords));

    // This adds totals of topX records to listOfWeightedCategories
    getWeightedTotals(listOfWeightedCategories, topXRecordColumns, true);
}


// General Method for Calculating Weighted Totals
function calculateTotalWeight() {
    let topXValue = getRadioButtonSelection('topX');
    // console.log(`topXValue: ${topXValue}`);
    listOfWeightedCategories = [];
    for (let i = 0; i < categoryPanelList.length; i++) {
        let categoryNumber = categoryPanelList[i];
        let catDict = {};
        let categoryId = 'selDataset' + (categoryNumber * 2);
        let valueId = 'selDataset' + (categoryNumber * 2 + 1);
        let weightId = 'numberInput' + (categoryNumber);

        let category_value = document.getElementById(categoryId).value;
        let value_value = document.getElementById(valueId).value;
        let weight_value = document.getElementById(weightId).value;
        if (weight_value != ""){
            catDict["category"] = category_value;
            catDict["value"] = value_value;
            catDict['range_All'] = getRadioButtonSelection(`rangeAllOrNothing${categoryNumber}`);
            catDict['weight'] = weight_value;
            catDict['topXWeightedValues'] = [];
            // console.log(`document.getElementById(\`range\${categoryNumber}\`): ${document.getElementById(`range${categoryNumber}`)}`);
            catDict['isTreatableAsANumber'] = !(document.getElementById(`range${categoryNumber}`).disabled);
            listOfWeightedCategories.push(catDict);
        }
    }
    // console.log(`listOfWeightedCategories: ${JSON.stringify(listOfWeightedCategories, null, 2)}`);

    dictRecordIndexAndWeightedTotal = getWeightedTotals(listOfWeightedCategories, dataByColumn, false);
    // console.log(`dictRecordIndexAndWeightedTotal: ${JSON.stringify(dictRecordIndexAndWeightedTotal, null, 2)}`);

    let sortedByValues = structuredClone(dictRecordIndexAndWeightedTotal);
    let entries = Object.entries(sortedByValues);
    let sortedArray = entries.sort(([, a], [, b]) => b - a);
    let sortedMap = new Map(sortedArray);
    // console.log('222999999999999999999');
    let sorted2DArray = [...sortedMap];

    // console.log(sorted2DArray);
    let count = 0;
    let topXIndicesAndTotalList = [];
    while (count < sorted2DArray.length && topXIndicesAndTotalList.length < topXValue) {
        if (!Number.isNaN(sorted2DArray[count][1])) {
            topXIndicesAndTotalList.push(sorted2DArray[count]);
        }
        count += 1;
    }
    let indicesAndTotalsForTopX = topXIndicesAndTotalList;
    // console.log(indicesAndTotalsForTopX);
    getRecordsByIndices(indicesAndTotalsForTopX);

}


// HMTL Manipulations ************************
// Disables the range button when a value like 'TX' is not a conveniently
// convertable to a number like '$27.01'
function disableRadioButton(disableIt, buttonId) {
    let radioButton = document.getElementById(buttonId);
    radioButton.disabled = disableIt;
    if (buttonId.includes('range') && disableIt) {
        let allOrNothingRadioButton = document.getElementById(`all${buttonId.substring('range'.length)}`);
        allOrNothingRadioButton.checked = true;
    } else if (buttonId.includes('range') && !disableIt) {
        radioButton.checked = true;

    }
}

// Populates the Values selection dropdown menu and orders them if they 
// are numbers
function populateValuesOfCategory(selectId) {
    let numStr = selectId.substring('selDataset'.length);
    let valueIdNum = parseInt(numStr) + 1;
    let valueId = 'selDataset' + valueIdNum;
    let dropDownMenuValue = d3.select(`#${valueId}`);

    let category_key = document.getElementById(selectId).value;

    let selectElement = dropDownMenuValue.node();

    if (selectElement && selectElement.options && selectElement.options.length > 0) {
        selectElement.options.length = 0;
    }

    
    // data can't be null
    if (dataByColumn != null) {

        let categoryDictionary = structuredClone(dataByColumn[category_key]);

        // Remove the duplicate values in the category
        let seenValues = new Set();
        let result = {};
        let allValuesAreNumbers = true;
        for (let key in categoryDictionary) {
            let value = categoryDictionary[key];
            if (!isDollarAmount(value) && typeof value != 'number' && value !== null) {
                // console.log(3);
                allValuesAreNumbers = false;
            }
            if (!seenValues.has(value)) {
                seenValues.add(value);
                result[key] = value;
            }
        }

        // console.log(`seenValues: ${seenValues}`);
        // seenValues.forEach(value => {
        //     console.log(`value: ${value}`);
        //   });
          

        // instead make a list of columns that makes sense to use as a range
        // in weighting and test if the current category is in the list
        if (isRangeCategory.includes(category_key)) {
            disableRadioButton(false, `range${parseInt(numStr) / 2}`);
        } else {
            disableRadioButton(true, `range${parseInt(numStr) / 2}`);
        }

        // console.log(`result: ${JSON.stringify(result)}`);
        let sortedByValues = structuredClone(result);
        let entries = Object.entries(sortedByValues);
        let sortedArray = entries.sort(([, a], [, b]) => a - b);
        let sortedMap = new Map(sortedArray);
        let sorted2DArray = [...sortedMap];
        // console.log(`sorted2DArray: ${sorted2DArray}`);
        for (let i = 0; i < sorted2DArray.length; i++) {
            let option1 = dropDownMenuValue.append('option').text(sorted2DArray[i][1]);
            option1.attr('value', sorted2DArray[i][1]);
        }
    }

}


// In case the user pastes into the textfield it, the textfield only allows for
// positive and negative numbers
function validatePaste(e) {
    let pastedText = e.clipboardData.getData('text');
    if (/[^-0-9.]/.test(pastedText) || (/\./.test(pastedText) && pastedText.match(/\./g).length > 1)) {
        e.preventDefault();
        return false;
    }
}


// Checks if the value entered via keyboard is regex 
function validateInput(event) {
    let inputField = document.getElementById(event.target.id);
    inputField.value = inputField.value.replace(/[^-0-9.]/g, '').replace(/(\..*)\./g, '$1');
}


// Populates the Category Selection Dropdown menu
function populateCategoryPanel(selDatasetId) {
    let dropDownMenu = d3.select(`#${selDatasetId}`);
    if (dataByColumn != null) {
        let keys = Object.keys(dataByColumn);
        keys.forEach(key => {
            let option1 = dropDownMenu.append('option').text(key);
            option1.attr('value', key);
        });
    }
}


// Action For all the buttons; Add Category Button, Calculate Total button
function buttonClicked(button) {
    if (button == 'addCategory') {
        addCategoryPanel();

        populateCategoryPanel(`selDataset${(categoryCount - 1) * 2}`);
        populateValuesOfCategory(`selDataset${(categoryCount - 1) * 2}`);
    } else if (button == 'calculateTotal') {

        listOfWeightedCategories = [];
        calculateTotalWeight();
        createWeightedMap();
        createBarChart();
        createCategoryChart();
        createDoughnutChart();
        createCorrelationsChart();


    } else if (button.includes('removeCategoryButton')) {
        removeCategoryButton(button);
    }
}


// Removes a Category Panel
function removeCategoryButton(button) {
    let categoryElementIdNumber = button.replace('removeCategoryButton', '');
    d3.select(`#category${categoryElementIdNumber}`).remove();
    let indexOfCategoryElementToRemove = categoryPanelList.indexOf(parseInt(categoryElementIdNumber));
    categoryPanelList.splice(indexOfCategoryElementToRemove, 1);
}


// Prevents Flagging of of the Weight textfield
function optionChangedValue(value_key) {
    // pass
}


// Fucntion to be called every time a new id is selected from the dropdown menu. When this funciton
// is called it executes the process that displays the data for the new person selected.
function optionChangedCategory(category_key) {
    if (dataByColumn != null) {

        let selectElement = category_key.target;
        populateValuesOfCategory(selectElement.id);
    }
}


// Return the value of the radio button selected
function getRadioButtonSelection(name1) {
    let selectedButton = document.querySelector(`input[name="${name1}"]:checked`).value;
    return selectedButton;
}


// Adds the 'Add Category' and 'Calculate Total'
function addButtons() {
    let lowerDiv = d3.select('#lowerDiv');
    let buttonDiv = lowerDiv.append('div');
    buttonDiv.attr('class', 'col-md-6');
    buttonDiv.attr('style', "margin-top: 10px !important;");
    buttonDiv.attr('id', 'addCalcButtonDiv');

    let buttonContainer = d3.select('#addCalcButtonDiv').append('div');
    buttonContainer.attr('id', 'addCalcButtonContainer');

    let addCalcButtonContainer = d3.select('#addCalcButtonContainer');
    let addButton = addCalcButtonContainer.append('button');
    addButton.attr('id', 'addCategory');
    addButton.attr('style', 'margin: 0px 6px 14px 2px; box-shadow: 0px 3px 4px 0px;');
    addButton.attr('onclick', 'buttonClicked("addCategory")');
    addButton.html('Add Category');

    let calcButton = addCalcButtonContainer.append('button');
    calcButton.attr('id', 'calculateTotal');
    calcButton.attr('style', 'margin: 0px 6px 14px 2px; box-shadow: 0px 3px 4px 0px;');
    calcButton.attr('onclick', 'buttonClicked("calculateTotal")');
    calcButton.html('Calculate Total');

    let buttonAdjacentLabel = addCalcButtonContainer.append('label');
    buttonAdjacentLabel.html('Click the "Calculate Total" button after entering a "Weight" to see charts and details.');
    buttonAdjacentLabel.attr('style', 'opacity: 0.8')
}

// Adds another category panel with 2 selectors, 2 radio buttons, and a textfield
function addCategoryPanel() {
    let categoryDiv = d3.select('#categories').append('div');
    categoryDiv.attr('class', 'col-md-12 category');
    categoryDiv.attr('style', `margin: 4px 0px;`);

    categoryDiv.attr('id', `category${categoryCount}`);

    let subcategoryDiv = d3.select(`#category${categoryCount}`).append('div');
    subcategoryDiv.attr('class', 'well');
    subcategoryDiv.attr('id', `subcategory${categoryCount}`);
    subcategoryDiv.attr('style', "box-shadow: 0px 3px 4px; ");

    let subcategoryDivContainer = d3.select(`#subcategory${categoryCount}`);
    let removeCategoryButton = subcategoryDivContainer.append('button');
    removeCategoryButton.attr('id', `removeCategoryButton${categoryCount}`);
    removeCategoryButton.attr('style', 'position: relative; left: 95%; top: 0px; margin-top: 0px; box-shadow: 0px .5px 1px 0px; font-size: .8rem;'); //border: 1px solid #000;')
    removeCategoryButton.attr('onclick', `buttonClicked("removeCategoryButton${categoryCount}")`);
    removeCategoryButton.html('X');

    let form = subcategoryDivContainer.append('form');
    form.attr('id', `form${categoryCount}`);
    document.getElementById(`form${categoryCount}`).addEventListener("submit", function (e) {
        e.preventDefault();
    });

    let hCat = form.append('h4');
    hCat.html('Category:');
    hCat.attr('style', 'font-weight: 600;')

    let select1 = form.append('select');
    select1.attr('id', `selDataset${categoryCount * 2}`);
    select1.attr('onchange', "optionChangedCategory(event)");

    form.append('br');

    let hValue = form.append('h5');
    hValue.attr('style', 'font-weight: 600;')
    hValue.html('Value:');

    let select2 = form.append('select');
    select2.attr('id', `selDataset${categoryCount * 2 + 1}`);
    select2.attr('onchange', "optionChangedValue(event)");

    form.append('br');

    let label3 = form.append('label')
    label3.attr('style', "margin-top: 10px; font-size: 10px;");
    label3.html('Value as range: &lpar; value X weight &rpar;');

    let input3 = form.append('input');
    input3.attr('type', 'radio');
    input3.attr('style', 'margin-left: 4px;');
    input3.attr('id', `range${categoryCount}`);
    input3.attr('name', `rangeAllOrNothing${categoryCount}`);
    input3.attr('value', 'range');
    input3.property('checked', true);

    form.append('br');

    let label4 = form.append('label')
    label4.attr('style', "font-size: 10px;");
    label4.html('&emsp;Value as All-Or-Nothing: &lpar; value/value X weight &rpar;');

    let input4 = form.append('input');
    input4.attr('type', 'radio');
    input4.attr('style', 'margin-left: 4px;');
    input4.attr('id', `all${categoryCount}`);
    input4.attr('name', `rangeAllOrNothing${categoryCount}`);
    input4.attr('value', 'all');

    form.append('br');

    let label5 = form.append('label')
    label5.attr('style', "font-size: 16px; margin-right: 4px;");
    label5.html('Weight: ');

    let input5 = form.append('input');
    input5.attr('type', 'text');
    input5.attr('id', `numberInput${categoryCount}`);
    input5.attr('oninput', "validateInput(event)");
    input5.attr('onpaste', "return validatePaste(event)");

    categoryPanelList.push(categoryCount);
    categoryCount += 1;
}



// Charts and Visuals **********************
// Returns an array of rgba strings
function getColors(numOfColorSteps, seed, alpha) {
    let colors1 = [];
    for (let i = 0; i < numOfColorSteps; i++) {
        colors1.push(getRGBAString(i, Math.random() * seed, alpha));
    }
    return colors1;
}

// Create Bar Chart that shows weighted totals for the topX records
function createBarChart() {

    let maxNameLength = Math.max(...topXRecordColumns['Provider Name'].map(name => name.length));
    // console.log(`MaxNameLength: *******${maxNameLength}`);
    // console.log(`topXRecordColumns['Provider Name']: ${topXRecordColumns['Provider Name']}`);

    let data = [{
        type: 'bar',
        x: topXRecordColumns['totalWeightedScore'],
        y: topXRecordColumns['Provider Name'],
        orientation: 'h',
        width: .8,
        marker: {
            color: 'rgba(58, 201, 80, 0.5)'  // This is an example using an RGBA value.
        }
    }];

    let catStr = "Category/ies: ";
    for (let i = 0; i < listOfWeightedCategories.length; i++) {
        catStr += listOfWeightedCategories[i].category + ', '
    }

    catStr = catStr.slice(-2, 0);

    let layout = {
        title: 'Provider Name By Total Weighted Scores',
        // width: 950,
        text: `${catStr}`,
        xaxis: {
            title: 'Total Weighted Scores'
        },
        yaxis: {
            title: 'Provider Name',
            titlestandoff: 65,
            // tickangle: -25,
            tickfont: {
                size: 10
            },
            tickprefix: '        '
        },
        margin: {
            l: (maxNameLength * 7)
        }
    };


    Plotly.newPlot('result', data, layout);
}

// Create a Correlation Chart for the Categories that have numbers
function createCorrelationsChart() {
    let ctx = document.getElementById('correlationsChart').getContext('2d');
    // console.log('Inside correlations&&&&&&&&&&');
    let data = [];
    let listOfCategories = [];
    let labels = [];
    let backgroundColor = [];
    let borderColor = [];

    for (let i = 0; i < listOfWeightedCategories.length; i++) {
        if (listOfWeightedCategories[i]['isTreatableAsANumber']) {
            listOfCategories.push(listOfWeightedCategories[i]['category']);
        }
    }

    for (let j = 0; j < listOfCategories.length; j++) {
        let currentCategory = listOfCategories[j];
        // Search for correct row
        for (let k = 0; k < correlationsByRow.length; k++) {
            // console.log(`correlationsByRow[k]['Column Of Category']: ${correlationsByRow[k]['Column Of Category']}`);
            // console.log(`listOfCategories[j]: ${listOfCategories[j]}`);
            if (correlationsByRow[k]['Column Of Category'].toLowerCase() == currentCategory.toLowerCase()) {
                let correlTableRow = correlationsByRow[k];
                for (let m = j; m < listOfCategories.length; m++) {
                    let secondCurrentCategory = listOfCategories[m];
                    if (currentCategory == secondCurrentCategory) {
                        continue;
                    }
                    let correlationCoefficient = correlTableRow[secondCurrentCategory.replace(/ In /g, ' in ').replace(/ Of /g, ' of ').replace(/ Per /g, ' per ')];
                    // console.log(`correlTableRow[secondCurrentCategory]: ${correlTableRow[secondCurrentCategory]}`);
                    // console.log(`correlTableRow: ${JSON.stringify(correlTableRow)}`);
                    // console.log(`secondCurrentCategory: ${secondCurrentCategory}`);
                    data.push(correlationCoefficient);
                    labels.push(`${currentCategory} -- ${secondCurrentCategory}`);

                    backgroundColor.push(`rgba(${(Math.abs(Math.floor((correlationCoefficient + 333) * 200))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 444) * 203))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 555) * 207))) % 256}, ${.6})`);
                    borderColor.push(`rgba(${(Math.abs(Math.floor((correlationCoefficient + 111) * 200))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 222) * 203))) % 256}, ${(Math.abs(Math.floor((correlationCoefficient + 333) * 207))) % 256}, ${.6})`);
                }

                // console.log(`data: ${data}`);
                // console.log(`labels: ${labels}`);


                break;
            }

        }
    }

    // Remove previous correlations chart if it exists
    if (correleationsCategoryChart) {
        correleationsCategoryChart.destroy();
    }

    // console.log(`correlationsByRows: ${JSON.stringify(correlationsByRow)}`)
    // Create chart
    correleationsCategoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Correlations Between Selected Categories',
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    },);
}


// Create a doughnut chart that shows the percentage of each category when totaled across all
// the topX records
function createDoughnutChart() {
    let ctx = document.getElementById('categoryDoughnutChart').getContext('2d');
    let labels = [];
    let data = [];
    let backgroundColor = [];
    let borderColor = [];

    for (let i = 0; i < listOfWeightedCategories.length; i++) {
        labels.push(listOfWeightedCategories[i]['category']);
        // console.log(`listOfWeightedCategories[i]['topXWeightedValues']: ${listOfWeightedCategories[i]['topXWeightedValues']}`);
        data.push(listOfWeightedCategories[i]['topXWeightedValues'].reduce((sum, weightedValue) => sum + weightedValue, 0));
        let weightedValue = data[data.length - 1];
        // console.log(`weightedValue: ${weightedValue}`);
        backgroundColor.push(`rgba(${(Math.abs(Math.floor((weightedValue + 333) * 200))) % 256}, ${(Math.abs(Math.floor((weightedValue + 444) * 203))) % 256}, ${(Math.abs(Math.floor((weightedValue + 555) * 207))) % 256}, ${.6})`);
        borderColor.push(`rgba(${(Math.abs(Math.floor((weightedValue + 111) * 200))) % 256}, ${(Math.abs(Math.floor((weightedValue + 222) * 203))) % 256}, ${(Math.abs(Math.floor((weightedValue + 333) * 207))) % 256}, ${.6})`);
    }


    // console.log(`labels: ${labels}`);
    // console.log(`data: ${data}`);
    // console.log(`backgroundColor: ${backgroundColor}`);

    // Remove previous doughnut chart
    if (doughnutChartWeightedTotals) {
        doughnutChartWeightedTotals.destroy();
    }

    // Create doughnut chart
    doughnutChartWeightedTotals = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Total Weight By Category'
            },
            cutoutPercentage: 50,
            responsive: true
        }
    });

}


// Create Markers for the leaflet map with a popup showing either the overall rating
// if it's the opening of the webpage or the total weighted value
function createMarkers(dataRow, myMap) {
    let features = [];

    for (let i = 0; i < dataRow.length; i++) {
        let feature = {};
        feature['type'] = 'Feature';
        feature['properties'] = dataRow[i];
        feature['geometry'] = {
            type: 'Point',
            coordinates: [parseFloat(dataRow[i].Longitude), parseFloat(dataRow[i].Latitude)]
        };
        features.push(feature);
        // console.log(`feature: ${JSON.stringify(feature)}`);
        // break;
    }

    let distributionMax;
    let distributionMin;

    // Find max and min of all 'totalWeightedScore's if already calculated,
    // otherwise find max and min of all 'Overall Rating's
    if ('totalWeightedScore' in features[0].properties) {
        distributionMax = features[0].properties['totalWeightedScore'];
        distributionMin = features[0].properties['totalWeightedScore'];
        for (let i = 0; i < features.length; i++) {
            if (features[i].properties['totalWeightedScore'] > distributionMax) {
                distributionMax = features[i].properties['totalWeightedScore'];
            }
            if (features[i].properties['totalWeightedScore'] < distributionMin) {
                distributionMin = features[i].properties['totalWeightedScore'];
            }
        }
    } else {
        distributionMax = features[0].properties['Overall Rating'];
        distributionMin = features[0].properties['Overall Rating'];
        for (let i = 0; i < features.length; i++) {
            if (features[i].properties['Overall Rating'] > distributionMax) {
                distributionMax = features[i].properties['Overall Rating'];
            }
            if (features[i].properties['Overall Rating'] < distributionMin) {
                distributionMin = features[i].properties['Overall Rating'];
            }
        }
    }


    // Create a geoJSON layer to add markers to map.
    L.geoJSON(features, {

        pointToLayer: function (feature, latlng) {
            let ranking = 0;
            let fillColor1 = "";

            // Test if 'totalWeightedScore' has been calculated and use it,
            // otherwise use 'Overall Rating'
            if ('totalWeightedScore' in feature.properties) {
                ranking = feature.properties['totalWeightedScore'];
            } else {
                ranking = feature.properties['Overall Rating'];
            }

            let diffMaxMin = distributionMax - distributionMin;

            // Test to assure index for colors will be between 5 and 0 inclusively
            if (diffMaxMin != 0){
                if (Math.floor(5 * (ranking - distributionMin) / diffMaxMin) <= 5 && Math.floor(5 * (ranking - distributionMin) / diffMaxMin) >= 0){
                    fillColor1 = colors[Math.floor(5 * (ranking - distributionMin) / diffMaxMin)];
                } else {
                    fillColor1 = colors[0];
                }
            } else {
                fillColor1 = colors[5];
            }


            markerOptions = {
                opacity: 1,
                fillOpacity: 0.65,
                color: 'black',
                weight: .3,
                fillColor: fillColor1,
                radius: 5//magnitude * 3
            };
            return L.circleMarker(latlng, markerOptions);
        },


        onEachFeature: function (feature, layer) {
            let latLng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

            if ('totalWeightedScore' in feature.properties) {
                layer.bindPopup(`<span style='font-size: 14px;'><strong>${feature.properties['Provider Name']}:<br>${feature.properties['Provider City']}, ${feature.properties['Provider State']}</strong><hr>Latitude: ${latLng[0].toFixed(3)}, Longitude: ${latLng[1].toFixed(3)}<br>Total Weighted Score: ${feature.properties['totalWeightedScore'].toFixed(3)}</span>`).addTo(myMap);
            } else {
                layer.bindPopup(`<span style='font-size: 14px;'><strong>${feature.properties['Provider Name']}:<br>${feature.properties['Provider City']}, ${feature.properties['Provider State']}</strong><hr>Latitude: ${latLng[0].toFixed(3)}, Longitude: ${latLng[1].toFixed(3)}<br>Overall Ratings: ${feature.properties['Overall Rating']} <br>Processing Date: ${feature.properties['Processing Date']}</span>`).addTo(myMap);
            }
        }
    }).addTo(myMap);
}

// Removes markers on map in preparation for new ones
function removeAllMapMarkers() {
    myMap.remove()
    let stepLabels = ['Least', '&emsp;.', '&emsp;.', '&emsp;.', '&emsp;.', 'Greatest'];
    createMap(topXRecords, 'Weighted Total', stepLabels, [topXRecords[0]['Latitude'], topXRecords[0]['Longitude']]);

}


// Creates the weighted map
function createWeightedMap() {
    removeAllMapMarkers();
    createMarkers(topXRecords, myMap);

}


// Creates the legend
function createLegend(myMap, legendLabels, legendTitle) {
    // Create L.Control object for the legend
    let legend = L.control({ position: 'bottomright' });

    // Implementing .onAdd method for the L.Control object
    legend.onAdd = function () {
        // Create a div to conatain the legend
        let div = L.DomUtil.create('div', 'legend');

        // Style the legend-div with a white background, a margin that is aesthetically appealling
        // (subjectively, of course), and round the corners of the div
        div.setAttribute('style', 'background-color: white; margin-left: 0px; padding: 0px 10px 0px 0px; border-radius: 5px;');
        let labels = [];


        // Create a string filled with html code to construct the legend-- primarily relying on a
        // unordered list and its elements
        let legendHTMLString = `<div style='padding: 4px; font-size: 1.2rem;'><strong>&emsp;${legendTitle}</strong><br><ul style=\"list-style-type: none; padding-left: 10px;\">`;
        for (let i = 0; i < colors.length; i++) {

            legendHTMLString += `<li><span style=\"background-color: ${colors[i]};\">&emsp;</span> ${legendLabels[i]}</li>`;

        }

        legendHTMLString += "</ul></div>";

        // Implement the string as html code
        div.innerHTML = legendHTMLString;

        // Return the fabricated div tag
        return div;
    }

    // Add the legend to the map
    legend.addTo(myMap);
}


// Create leaflet map given data a legend title and step labels for the legend
function createMap(dataRows, legendTitle, stepLabels, startCoordinates) {
    // console.log(`dataRows: \n${dataRows}`);
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })

    let zoomLevel = 4;

    // Zoom out if start coordinate is not in mainland USA
    if (startCoordinates[0] > 48 || startCoordinates[0] < 25 || startCoordinates[1] > 125){
        zoomLevel = 3;
    }

    myMap = L.map("map1", {
        center: startCoordinates,
        zoom: zoomLevel,
        layers: [street]
    });

    // Create and add the markers to the map
    createMarkers(dataRows, myMap);


    // Create and the markers to the map
    createLegend(myMap, stepLabels, legendTitle);
}


function getRGBAString(value, initialSeed, alpha) {
    return `rgba(${(Math.abs(Math.floor((value + initialSeed + 333) * 200))) % 256}, ${(Math.abs(Math.floor((value + initialSeed + 444) * 203))) % 256}, ${(Math.abs(Math.floor((value + initialSeed + 555) * 207))) % 256}, ${alpha})`;
}


// Create Category Chart that shows a breakdown of the weighted total for
// each category for each retirement home
function createCategoryChart() {

    // console.log('1');
    let arrOfTraces = [];
    for (let h = 0; h < listOfWeightedCategories.length; h++) {
        // console.log(`color${h}: ${getRGBAString(h, h + 390, 0.5)}`);
        // console.log(`color${h}: ${getRGBAString(h, h + 390, 0.8)}`);
        let trace = {
            type: 'bar',
            opacity: 0.6,
            marker: {
                color: getRGBAString(h, h + 390, 0.7),
                line: {
                    color: getRGBAString(h, h + 390, 1),
                }
            }
        };
        let x = topXRecordColumns['Provider Name'];
        trace['x'] = x;
        let category = listOfWeightedCategories[h].category;
        trace['name'] = category;
        let y = [];
        let text = [];
        for (let i = 0; i < topXRecords.length; i++) {
            let value = topXRecordColumns[category][i];
            text.push(`Value: ${value}`);
            let range_all = listOfWeightedCategories[h].range_All;
            if (range_all == 'range') {

                y.push(parseFloat(value) * parseFloat(listOfWeightedCategories[h].weight));
            } else if (String(value) == String(listOfWeightedCategories[h].value)) {
                y.push(parseFloat(listOfWeightedCategories[h].weight));
            } else {
                y.push(0);
            }
        }
        trace['y'] = y;
        trace['text'] = text;
        // console.log(JSON.stringify(trace));
        arrOfTraces.push(trace);
    }

    // console.log(JSON.stringify(arrOfTraces));
    let layout = {
        title: 'Category Weight Contribution By Provider',
        barmode: 'group',
        yaxis: {
            title: 'Category Weight Contribution'
        },
        margin: {
            b: 200
        }
    };

    // Plot the chart
    Plotly.newPlot('groupedChart', arrOfTraces, layout);
}


// Importing Data *********************
// Get Correlation data from general data for correlation charts (LOCAL)
// d3.json(urlJSONCorrelationsByRow).then(function (correlationsData) {
//     correlationsByRow = structuredClone(correlationsData);
// });


// Get Correlation data by Server
fetch('static/DatasetManipulations/correlations_df_by_record.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(correlationsData => {
        correlationsByRow = structuredClone(correlationsData);

        // console.log(correlationsData);
    })
    .catch(error => {
        console.error('Error:', error);
    });


// Get retirement home data by Row (record) (LOCAL)
//   d3.json(urlJSONByRow).then(function (dataRows) {
//       dataByRow = structuredClone(dataRows);
//       console.log('Data by Row: ');
//       console.log(dataRows);
//       createMap(dataRows, 'Overall Rating', ['null', 1,2,3,4,5]);

//   });

// Loads the dataByRow variable using the dataByColumn Variable
function loadDataByRow(dataColumns) {
    dataByRow = [];
    let listOfKeys = Object.keys(dataColumns);
    // console.log(listOfKeys);
    // console.log(`Object.keys(dataColumns['provider_name']).length: ${Object.keys(dataColumns['Provider Name']).length}`);
    for (let i = 0; i < Object.keys(dataColumns['Provider Name']).length; i++) {
        let record = {};
        for (let j = 0; j < listOfKeys.length; j++) {
            record[listOfKeys[j]] = dataColumns[listOfKeys[j]][i];
        }

        dataByRow.push(record);
    }
    // console.log('data by row: ');
    // console.log(dataByRow);
    createMap(dataByRow, 'Overall Rating', ['null', 1,2,3,4,5], centerOfUSA);

}

// Get retirement home data by Column (by server)
fetch('/get_data_by_column')
    .then(response => response.json())
    .then(function (dataColumns) {
        dataByColumn = structuredClone(dataColumns);
        // console.log(bootstrap.Tooltip.VERSION);

        // Quick printout-sanity-check
        // console.log('Data by Column:');
        // console.log(dataColumns);

        function initialize() {
            addCategoryPanel();

            let dropDownMenu = d3.select('#selDataset0');
            let keys = Object.keys(dataColumns);
            keys.forEach(key => {
                // console.log(key);
                let option1 = dropDownMenu.append('option').text(key);
                option1.attr('value', key);
            });
            // console.log('**************');
            // console.log(data1['Federal Provider Number']);

            populateValuesOfCategory('selDataset0');

            addButtons();

            loadDataByRow(dataColumns);
        }

        initialize();
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });


// Get retirement home data by Column (LOCAL)
// d3.json(urlJSONByColumn).then(function (dataColumns) {
//     dataByColumn = structuredClone(dataColumns);
//     // console.log(bootstrap.Tooltip.VERSION);

//     // Quick printout-sanity-check
//     console.log('Data by Column:');
//     console.log(dataColumns);

//     function initialize() {
//         addCategoryPanel();

//         let dropDownMenu = d3.select('#selDataset0');
//         let keys = Object.keys(dataColumns);
//         keys.forEach(key => {
//             // console.log(key);
//             let option1 = dropDownMenu.append('option').text(key);
//             option1.attr('value', key);
//         });
//         console.log('**************');
//         // console.log(data1['Federal Provider Number']);

//         populateValuesOfCategory('selDataset0');

//         addButtons();

//         loadDataByRow(dataColumns);
//     }

//     initialize();


// });