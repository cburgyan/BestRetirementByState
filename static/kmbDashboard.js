const url = '/static/DatasetManipulations/truncated_nursing_df2.json'
let dropDownMenuValue;
let categoryCount = 0;


// Global variable to hold a deep copy of retrieved data
let data = null;
let alreadyPopulated = false;


function disableRadioButton(disableIt, buttonId) {
    let radioButton = document.getElementById(buttonId);
    radioButton.disabled = disableIt;
    if (buttonId.includes('range') && disableIt){
        let allOrNothingRadioButton = document.getElementById(`all${buttonId.substring('range'.length)}`);
        allOrNothingRadioButton.checked = true;
    } else if (buttonId.includes('range') && !disableIt){
        radioButton.checked = true;

    }
  }

function populateValuesOfCategory(selectId){
    let numStr = selectId.substring('selDataset'.length);
    console.log("heyyyy" + numStr);
    let valueIdNum = parseInt(numStr) + 1;
    let valueId = 'selDataset' + valueIdNum;
    let dropDownMenuValue = d3.select(`#${valueId}`);

    let category_key = document.getElementById(selectId).value;



    console.log(`category_key: ${category_key}`);
    console.log(`category_key.value: ${category_key.value}`);
    // console.log(category_key.value);
    // let keys = Object.keys(data1);
    console.log('hi');


    let selectElement = dropDownMenuValue.node(); // Get the actual DOM element

    if(selectElement && selectElement.options && selectElement.options.length > 0) {
        selectElement.options.length = 0;
    }
    
    // data can't be null
    if (data != null){

        let categoryDictionary = structuredClone(data[category_key]);

        // Remove the duplicate values in the category
        let seenValues = new Set();
        let result = {};
        let allValuesAreNumbers = true;
        for (let key in categoryDictionary) {
            let value = categoryDictionary[key];
            if (typeof value !== 'number' && value !== null){
                allValuesAreNumbers = false;
            }
            if (!seenValues.has(value)) {
                seenValues.add(value);
                result[key] = value;
            }
        }


        // instead make a list of columns that makes sense to use as a range
        // in weighting and test if the current category is in the list
        if (allValuesAreNumbers){
            disableRadioButton(false, `range${parseInt(numStr)/2}`);
        } else{
            disableRadioButton(true, `range${parseInt(numStr)/2}`);
        }


        // console.log(dropDownMenuValue);

        let sortedByValues = structuredClone(result);
        let entries = Object.entries(sortedByValues);
        let sortedArray = entries.sort(([, a], [, b]) => a - b);
        let sortedMap = new Map(sortedArray);
        // console.log('222999999999999999999');
        let sorted2DArray = [...sortedMap];

        for (let i = 0; i < sorted2DArray.length; i++){
            let option1 = dropDownMenuValue.append('option').text(sorted2DArray[i][1]);
            option1.attr('value', sorted2DArray[i][1]);
        }
        // alreadyPopulated = true;
    }

}


function validateInput(event) {
    var inputField = document.getElementById(event.target.id);
    inputField.value = inputField.value.replace(/[^-0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

function validatePaste(e) {
    var pastedText = e.clipboardData.getData('text');
    if (/[^-0-9.]/.test(pastedText) || (/\./.test(pastedText) && pastedText.match(/\./g).length > 1)) {
        e.preventDefault();
        return false;
    }
}


function populateCategoryPanel(selDatasetId){
    let dropDownMenu = d3.select(`#${selDatasetId}`);
    if (data != null){
        let keys = Object.keys(data);
        keys.forEach(key =>{
            let option1 = dropDownMenu.append('option').text(key);
            option1.attr('value', key);
        });
        console.log('**************');
        console.log(data['Federal Provider Number']);
    }
}


function getRadioButtonSelection(name1){
        let selectedButton = document.querySelector(`input[name="${name1}"]:checked`).value;
        return selectedButton;
}


function getAllOrNothingRecords(l1ListOfWeightedCategories){
    let listOfAllOrNothingCatAndValue = [];
    for (let i = 0; i < l1ListOfWeightedCategories.length; i++){
        if (l1ListOfWeightedCategories[i]['range_All'] == 'all'){
            listOfAllOrNothingCatAndValue.push(l1ListOfWeightedCategories[i]);
        }
    }
    alert('getting Records1');
    let listOfRecordIndices = [];
    for (let i = 0; i < listOfAllOrNothingCatAndValue.length; i++){
        let category = listOfAllOrNothingCatAndValue[i]['category'];
        let value = listOfAllOrNothingCatAndValue[i]['value'];
        console.log(`value: ${value}`);
        console.log(`category: ${category}`);
        console.log(`data[category][0]: ${data[category][0]}`);
        console.log(`Object.keys(data[category]).length: ${Object.keys(data[category]).length}`);
        for (let j = 0; j < Object.keys(data[category]).length; i++){
            if (data[category][j] == value){
                listOfRecordIndices.push(j);
            }
        }
    }
    alert('getting Records2');
    console.log('done getting the set');
    return listOfRecordIndices;
}


function calculateTotalWeight(){
    let topXValue = getRadioButtonSelection('topX');
    console.log(`topXValue: ${topXValue}`);
    let listOfWeightedCategories = [];
    alert('calc before for');
    for (let i = 0; i < categoryCount; i++){
        let catDict = {};
        let categoryId = 'selDataset' + (i * 2);
        let valueId = 'selDataset' + (i * 2 + 1);
        let weightId = 'numberInput' + (i);

        let category_value = document.getElementById(categoryId).value;
        let value_value = document.getElementById(valueId).value;
        let weight_value = document.getElementById(weightId).value;

        catDict["category"] = category_value;
        catDict["value"] = value_value;
        catDict['range_All'] = getRadioButtonSelection(`rangeAllOrNothing${i}`);
        catDict['weight'] = weight_value;
        listOfWeightedCategories.push(catDict);
    }
    console.log(`listOfWeightedCategories: ${JSON.stringify(listOfWeightedCategories, null, 2)}`);

    let listOfAllOrNothingRecords = getAllOrNothingRecords(listOfWeightedCategories);
    console.log(`listOfAllOrNothingRecords.size${listOfAllOrNothingRecords.size}`);

}


function buttonClicked(button) {
    if (button == 'addCategory'){
        addCategoryPanel();

        populateCategoryPanel(`selDataset${(categoryCount - 1) * 2}`);
        populateValuesOfCategory(`selDataset${(categoryCount - 1) * 2}`);
    } else if (button == 'calculateTotal'){
        calculateTotalWeight();
    }
  }
  




function optionChangedValue(value_key){
    console.log('In optionChangedValue');
}

// Fucntion to be called every time a new id is selected from the dropdown menu. When this funciton
// is called it executes the process that displays the data for the new person selected.
function optionChangedCategory(category_key){
    if (data != null){
        
        let selectElement = category_key.target;
        populateValuesOfCategory(selectElement.id);
    }
}


function addButtons(){
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
    addButton.attr('style', 'margin-right: 6px;');
    addButton.attr('onclick', 'buttonClicked("addCategory")');
    addButton.html('Add Category');

    let calcButton = addCalcButtonContainer.append('button');
    calcButton.attr('id', 'calculateTotal');
    calcButton.attr('onclick', 'buttonClicked("calculateTotal")');
    calcButton.html('Calculate Total');
}


function addCategoryPanel(){
    // let categoriesDiv = d3.select('.categories');
    let categoryDiv = d3.select('#categories').append('div');
    categoryDiv.attr('class', 'col-md-8 category');
    categoryDiv.attr('style', `margin: 4px 0px;`);
    
    categoryDiv.attr('id', `category${categoryCount}`);
    // categoryDiv.attr('style', 'background-color: green;');

    categoryDiv.innerHMTL = 'hi';
    
    let subcategoryDiv = d3.select(`#category${categoryCount}`).append('div');
    subcategoryDiv.attr('class', 'well');
    subcategoryDiv.attr('id', `subcategory${categoryCount}`);
    subcategoryDiv.attr('style', "box-shadow: 0px 3px 4px; ");


    let form = d3.select(`#subcategory${categoryCount}`).append('form');
    form.attr('id', `form${categoryCount}`);


    let hCat = d3.select(`#form${categoryCount}`).append('h4');
    hCat.html('Category:');
    console.log('%%%%%%%%%%%%%%%%');
    console.log(categoryCount);
    let select1 = form.append('select');
    select1.attr('id', `selDataset${categoryCount * 2}`);
    select1.attr('onchange', "optionChangedCategory(event)");

    form.append('br');

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
    
    categoryCount += 1;

}

d3.json(url).then(function(data1){
    data = structuredClone(data1);

    // Quick printout-sanity-check
    console.log(data1);

    function initialize(){
        addCategoryPanel();

        let dropDownMenu = d3.select('#selDataset0');
        let keys = Object.keys(data1);
        keys.forEach(key =>{
            // console.log(key);
            let option1 = dropDownMenu.append('option').text(key);
            option1.attr('value', key);
        });
        console.log('**************');
        console.log(data1['Federal Provider Number']);

        populateValuesOfCategory('selDataset0');

        addButtons();
    }

    initialize();


});