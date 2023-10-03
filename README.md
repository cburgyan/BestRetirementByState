# Project 3: Best Retirement By State

## Collaborators:<br>
Karoly Burgyan<br>
Thanh Le Dinh<br>
Shayla Badeaux<br>
Maria Paula Parra<br>
Christian Cantu<br>

---
## Sources 
<ol>
    <li>Jinja (with Flask). n.d. https://palletsprojects.com/p/jinja/</li>
    <li>Nursing Home Quality and Staffing Database. https://www.kaggle.com/datasets/thedevastator/nursing-home-quality-staffing</li>
</ol>

---
## Project Outline
For Project 3, you will work with your group to tell a story using data visualizations. Here are the specific requirements:<br>
1. Your visualization must include a Python Flask-powered API, HTML/CSS, JavaScript, and at least one database (SQL, MongoDB, SQLite, etc.).<br>
2. Your project should fall into one of the following three tracks:<br>
 a. A combination of web scraping and Leaflet or Plotly<br>
 b. A dashboard page with multiple charts that update from the same data<br>
 c. A server that performs multiple manipulations on data in a database prior to visualization (must be approved)<br>
3. Your project should include at least one JS library that we did not cover.<br>
4. Your project must be powered by a dataset with at least 100 records.<br>
5. Your project must include some level of user-driven interaction (e.g., menus, dropdowns, textboxes).<br>
6. Your final visualization should ideally include at least three views.<br>
For this project, you can focus your efforts within a specific industry: Finance, Healthcare, Custom.<br>

## Project Question 
What are the best places to retire in each state?<br>

## Creating the DataFrames:
ETL for creating the 'business', 'performance',  and 'zipcode' DataFrames began by reading in raw data from .xlsx files into a general DataFrame.
<ol style='list-style-type: upper-roman;'>
    <li>
        Inspecting the data via the number of rows/columns, list of all columns present and their associated data types, and investigating any non-values if present.
    </li>
    <li>
        Dropping any duplicate rows, if any. (None were found)
    </li>
    <li>
        Adding Null to any records with non-values. 
    </li>
    <li>
        Separating the Coordinates column into separate Longitude and Latitude columns.
    </li>
    <li>
        Removing any extraneous columns and leaving only the ones necessary for our analysis.
    <li>
        Creating the three separate DataFrames from the newly cleaned DataFrame.
    </li>
    






