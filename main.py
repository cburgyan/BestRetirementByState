from flask import Flask, render_template, send_file

app = Flask(__name__)

# Define a route to serve the GeoJSON file
# if go the route it will automatically download the geojson file
@app.route('/geojson')
def geojson():
    geojson_filename = 'static/DatasetManipulations/map_5rating.geojson'
    return send_file(geojson_filename, as_attachment=True) 

# adding route for 5 stars nursing home 
@app.route('/filterMap')
def another_geojson():
    geojson_filename = 'static/DatasetManipulations/map.geojson'
    return send_file(geojson_filename, as_attachment=True) 
# Define routes for your existing pages
@app.route('/')
def home():
    return render_template("index.html")

@app.route('/maps')
def maps():
    return render_template("homesInMaps.html")

@app.route('/Dashboard')
def dashboard():
    return render_template("dashboard.html")


@app.route('/Dashboard2')
def dashboard2():

    return render_template("kmbDashboard.html")


if __name__ == "__main__":
    app.run(debug=True)

