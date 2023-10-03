

// Define the URL for your JSON data source (replace with your Flask route)
const dataUrl = "http://127.0.0.1:5000/dashboardjson";

// Function to create a bar graph for a selected state
function createBarGraph(selectedState) {
  // Fetch data from the Flask route
  fetch(dataUrl)
    .then(response => response.json())
    .then(data => {
      // Filter data based on the selected state
      const filteredData = data.filter(item => item["Provider State"] === selectedState);

      // Extract necessary data for the bar chart
      const providerNames = filteredData.map(item => item["Provider Name"]);
      const overallRatings = filteredData.map(item => parseFloat(item["Overall Rating"]));

      // Create a trace for the bar chart
      const trace = {
        x: providerNames,
        y: overallRatings,
        type: "bar",
        marker: {
          color: 'blue', // Customize the color
        }
      };

      // Create layout for the bar chart
      const layout = {
        title: `Nursing Home Overall Ratings in ${selectedState}`,
        xaxis: {
          title: "Provider Name"
        },
        yaxis: {
          title: "Overall Rating"
        }
      };

      // Plot the bar chart
      Plotly.newPlot("bar", [trace], layout);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Function to populate the dropdown menu with unique states
function populateDropdownMenu() {
  // Fetch data from the Flask route
  fetch(dataUrl)
    .then(response => response.json())
    .then(data => {
      // Get unique states from the data
      const uniqueStates = [...new Set(data.map(item => item["Provider State"]))];

      // Select the dropdown element
      const dropdown = document.getElementById("stateDropdown");

      // Add an "All" option to the dropdown
      const allOption = document.createElement("option");
      allOption.text = "All";
      allOption.value = "All";
      dropdown.appendChild(allOption);

      // Add options for each unique state
      uniqueStates.forEach(state => {
        const option = document.createElement("option");
        option.text = state;
        option.value = state;
        dropdown.appendChild(option);
      });

      // Add an event listener to the dropdown to update the bar graph
      dropdown.addEventListener("change", function () {
        const selectedState = dropdown.value;
        createBarGraph(selectedState);
      });
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Initialize the dropdown menu and bar graph
populateDropdownMenu();
createBarGraph("All"); // Initially, show data for all states
