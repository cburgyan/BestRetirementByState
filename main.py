from flask import Flask, jsonify, render_template, url_for


app = Flask(__name__)

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
