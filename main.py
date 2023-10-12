from flask import Flask, render_template, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship
import os
import psycopg2




list_of_truncated_nursing_dataframe_columns = ['Federal Provider Number', 'Provider Name',
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
    'Adjusted Total Nurse Staffing Hours per Resident per Day', 'Longitude']


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # silence the deprecation warning
DATABASE_URL = os.environ['DATABASE_URL']

conn = psycopg2.connect(DATABASE_URL, sslmode='require')
db = SQLAlchemy(app)


class Zipcode(db.Model):
    __tablename__ = "zipcode_table"

    provider_state = db.Column(db.String(2), nullable=False)
    provider_zip_code = db.Column(db.String(10), primary_key=True)


class Performance(db.Model):
    __tablename__ = "performance_table"

    most_recent_health_inspection_more_than_2_years_ago = db.Column(
        db.String(5), nullable=False
    )
    overall_rating = db.Column(db.Float)
    health_inspection_rating = db.Column(db.Float)
    staffing_rating = db.Column(db.Float)
    rn_staffing_rating = db.Column(db.Float)
    total_weighted_health_survey_score = db.Column(db.Numeric(10, 3))
    number_of_facility_reported_incidents = db.Column(db.Integer, nullable=False)
    number_of_substantiated_complaints = db.Column(db.Integer, nullable=False)
    number_of_fines = db.Column(db.Integer, nullable=False)
    total_amount_of_fines_in_dollars = db.Column(
        db.String, nullable=False
    )  # This could potentially be Numeric/Float type based on the actual data
    number_of_payment_denials = db.Column(db.Integer, nullable=False)
    total_number_of_penalties = db.Column(db.Integer, nullable=False)
    performance_id = db.Column(db.Integer, primary_key=True)


class Business(db.Model):
    __tablename__ = "business_table"

    federal_provider_number = db.Column(db.String, primary_key=True, nullable=False)
    provider_name = db.Column(db.String(225), nullable=False)
    provider_city = db.Column(db.String(50), nullable=False)
    provider_zip_code = db.Column(
        db.String, db.ForeignKey("zipcode_table.provider_zip_code"), nullable=False
    )
    provider_county_name = db.Column(db.String(50), nullable=False)
    ownership_type = db.Column(db.String(50), nullable=False)
    number_of_certified_beds = db.Column(db.Integer, nullable=False)
    number_of_residents_in_certified_beds = db.Column(db.Integer, nullable=False)
    provider_type = db.Column(db.String(50), nullable=False)
    provider_resides_in_hospital = db.Column(db.String(5), nullable=False)
    automatic_sprinkler_systems_in_all_required_areas = db.Column(
        db.String(10), nullable=False
    )
    location = db.Column(db.String(225), nullable=False)
    processing_date = db.Column(db.Date, nullable=False)
    latitude = db.Column(db.Numeric(10, 6), nullable=False)
    longitude = db.Column(db.Numeric(10, 6), nullable=False)
    adjusted_total_nurse_staffing_hours_per_resident_per_day = db.Column(
        db.Numeric(8, 6)
    )
    performance_id = db.Column(
        db.Integer, db.ForeignKey("performance_table.performance_id"), nullable=False
    )


# # Define a route to serve the GeoJSON file
# # if go the route it will automatically download the geojson file
# @app.route('/bestNS')
# def bestNS():
#     filename = 'static/DatasetManipulations/best_nsHomes.json'
#     return send_file(filename)

# @app.route('/dashboardjson')
# def dashboardjson():
#     geojson_filename3 = 'static/DatasetManipulations/dashboard_tx.json'
#     return send_file(geojson_filename3)

# @app.route('/geojson')
# def geojson():
#     geojson_filename = 'static/DatasetManipulations/all_nursing_homes.geojson'
#     return send_file(geojson_filename)

# # adding route for 5 stars nursing home
# @app.route('/mappingjson')
# def another_geojson():
#     geojson_filename2 = 'static/DatasetManipulations/mapping.json'
#     return send_file(geojson_filename2)

# # Define routes for your existing pages
# @app.route('/')
# def home():
#     return render_template("index.html")

# @app.route('/maps')
# def maps():
#     return render_template("homesInMaps.html")



def change_key_name(dictionary, old_key, new_key):
    if old_key in dictionary:
        dictionary[new_key] = dictionary.pop(old_key)
    return dictionary

@app.route('/get_data_by_column')
def get_data_by_column():

    # Use SQLAlchemy's join functionality to get the combined data
    results = db.session.query(
        Business, Zipcode, Performance
    ).join(
        Zipcode, Business.provider_zip_code == Zipcode.provider_zip_code
    ).join(
        Performance, Business.performance_id == Performance.performance_id
    ).all()

    print(type(results))
    print(f'results: {results[0]}')
    print(f'length: {len(results)}')
    for i in range(10):
        print(results[i][0])
    # Create dictionaries for each table/column

    final_results = {
    'Federal Provider Number':{},
    'Provider Name':{},
    'Provider City':{},
    'Provider State':{},
    'Provider Zip Code':{},
    'Provider County Name':{},
    'Ownership Type':{},
    'Number Of Certified Beds':{},
    'Number Of Residents In Certified Beds':{},
    'Provider Type':{},
    'Provider Resides In Hospital':{},
    'Most Recent Health Inspection More Than 2 Years Ago':{},
    'Automatic Sprinkler Systems In All Required Areas':{},
    'Overall Rating':{},
    'Health Inspection Rating':{},
    'Staffing Rating':{},
    'RN Staffing Rating':{},
    'Total Weighted Health Survey Score':{},
    'Number Of Facility Reported Incidents':{},
    'Number Of Substantiated Complaints':{},
    'Number Of Fines':{},
    'Total Amount Of Fines In Dollars':{},
    'Number Of Payment Denials':{},
    'Total Number Of Penalties':{},
    'Location':{},
    'Processing Date':{},
    'Latitude':{},
    'Adjusted Total Nurse Staffing Hours Per Resident Per Day':{},
    'Longitude':{},
    'Performance Id':{}
    }
    # final_results = {
    #     'federal_provider_number': {},
    #     'provider_name': {},
    #     'provider_city': {},
    #     'provider_zip_code': {},
    #     'provider_county_name': {},
    #     'ownership_type': {},
    #     'number_of_certified_beds': {},
    #     'number_of_residents_in_certified_beds': {},
    #     'provider_type': {},
    #     'provider_resides_in_hospital': {},
    #     'automatic_sprinkler_systems_in_all_required_areas': {},
    #     'location': {},
    #     'processing_date': {},
    #     'latitude': {},
    #     'longitude': {},
    #     'adjusted_total_nurse_staffing_hours_per_resident_per_day': {},
    #     'provider_state': {},
    #     'provider_zip_code': {},
    #     'most_recent_health_inspection_more_than_2_years_ago': {},
    #     'overall_rating': {},
    #     'health_inspection_rating': {},
    #     'staffing_rating': {},
    #     'rn_staffing_rating': {},
    #     'total_weighted_health_survey_score': {},
    #     'number_of_facility_reported_incidents': {},
    #     'number_of_substantiated_complaints': {},
    #     'number_of_fines': {},
    #     'total_amount_of_fines_in_dollars': {},
    #     'number_of_payment_denials': {},
    #     'total_number_of_penalties': {},
    #     'performance_id': {}
    # }

    
    business_data = [
        'federal_provider_number',
        'provider_name',
        'provider_city',
        'provider_zip_code',
        'provider_county_name',
        'ownership_type',
        'number_of_certified_beds',
        'number_of_residents_in_certified_beds',
        'provider_type',
        'provider_resides_in_hospital',
        'automatic_sprinkler_systems_in_all_required_areas',
        'location',
        'processing_date',
        'latitude',
        'longitude',
        'adjusted_total_nurse_staffing_hours_per_resident_per_day'
    ]

    zipcode_data = [
        'provider_state',
        'provider_zip_code'
    ]

    performance_data = [
        'most_recent_health_inspection_more_than_2_years_ago',
        'overall_rating',
        'health_inspection_rating',
        'staffing_rating',
        'rn_staffing_rating',
        'total_weighted_health_survey_score',
        'number_of_facility_reported_incidents',
        'number_of_substantiated_complaints',
        'number_of_fines',
        'total_amount_of_fines_in_dollars',
        'number_of_payment_denials',
        'total_number_of_penalties',
        'performance_id'
    ]

    count = 0
    for business, zipcode, performance in results:
        for key in business_data:
            final_results[(key.replace('_', ' ')).title()][count] = getattr(business, key)
        for key in zipcode_data:
            final_results[(key.replace('_', ' ')).title()][count] = getattr(zipcode, key)
        for key in performance_data:
            if key != 'rn_staffing_rating':
                final_results[(key.replace('_', ' ')).title()][count] = getattr(performance, key)
            else:
                final_results['RN Staffing Rating'][count] = getattr(performance, key)

        count += 1

    # print(f"final_results['Performance Id']: {final_results['Performance Id']}")
    # for key in final_results:
    #     for elem in list_of_truncated_nursing_dataframe_columns:
    #         if elem.lower() == key.replace('_', ' '):
    #             final_results = change_key_name(final_results, key, elem)

    # business_data = {
    #     'federal_provider_number': [],
    #     'provider_name': [],
    #     'provider_city': [],
    #     'provider_zip_code': [],
    #     'provider_county_name': [],
    #     'ownership_type': [],
    #     'number_of_certified_beds': [],
    #     'number_of_residents_in_certified_beds': [],
    #     'provider_type': [],
    #     'provider_resides_in_hospital': [],
    #     'automatic_sprinkler_systems_in_all_required_areas': [],
    #     'location': [],
    #     'processing_date': [],
    #     'latitude': [],
    #     'longitude': [],
    #     'adjusted_total_nurse_staffing_hours_per_resident_per_day': [],
    #     'performance_id': []
    # }

    # zipcode_data = {
    #     'provider_state': [],
    #     'provider_zip_code': []
    # }

    # performance_data = {
    #     'most_recent_health_inspection_more_than_2_years_ago': [],
    #     'overall_rating': [],
    #     'health_inspection_rating': [],
    #     'staffing_rating': [],
    #     'rn_staffing_rating': [],
    #     'total_weighted_health_survey_score': [],
    #     'number_of_facility_reported_incidents': [],
    #     'number_of_substantiated_complaints': [],
    #     'number_of_fines': [],
    #     'total_amount_of_fines_in_dollars': [],
    #     'number_of_payment_denials': [],
    #     'total_number_of_penalties': [],
    #     'performance_id': []
    # }

    # for business, zipcode, performance in results:
    #     for key in business_data:
    #         business_data[key].append(getattr(business, key))
    #     for key in zipcode_data:
    #         zipcode_data[key].append(getattr(zipcode, key))
    #     for key in performance_data:
    #         performance_data[key].append(getattr(performance, key))

    # combined_data = {**business_data, **zipcode_data, **performance_data}

    # # Convert combined_data to a list of dictionaries, where each dictionary represents a column
    # dataByColumn = [{"columnName": key, "values": value} for key, value in combined_data.items()]

    return jsonify(final_results)





@app.route("/get_data_by_row")
def get_data_by_row():
    # Use SQLAlchemy's join functionality to get the combined data
    results = (
        db.session.query(Business, Zipcode, Performance)
        .join(Zipcode, Business.provider_zip_code == Zipcode.provider_zip_code)
        .join(Performance, Business.performance_id == Performance.performance_id)
        .all()
    )

    # Convert results to a list of dictionaries to be JSON serializable
    data = []
    for business, zipcode, performance in results:
        item = {
            # Business fields
            "federal_provider_number": business.federal_provider_number,
            "provider_name": business.provider_name,
            "provider_city": business.provider_city,
            "provider_county_name": business.provider_county_name,
            "ownership_type": business.ownership_type,
            "number_of_certified_beds": business.number_of_certified_beds,
            "number_of_residents_in_certified_beds": business.number_of_residents_in_certified_beds,
            "provider_type": business.provider_type,
            "provider_resides_in_hospital": business.provider_resides_in_hospital,
            "automatic_sprinkler_systems_in_all_required_areas": business.automatic_sprinkler_systems_in_all_required_areas,
            "location": business.location,
            "processing_date": business.processing_date.strftime("%Y-%m-%d")
            if business.processing_date
            else None,  # format date as string
            "latitude": float(business.latitude),
            "longitude": float(business.longitude),
            "adjusted_total_nurse_staffing_hours_per_resident_per_day": float(
                business.adjusted_total_nurse_staffing_hours_per_resident_per_day
            ),

            # Zipcode fields
            "provider_state": zipcode.provider_state,
            "provider_zip_code": zipcode.provider_zip_code,

            # Performance fields
            "most_recent_health_inspection_more_than_2_years_ago": performance.most_recent_health_inspection_more_than_2_years_ago,
            "overall_rating": float(performance.overall_rating),
            "health_inspection_rating": float(performance.health_inspection_rating),
            "staffing_rating": float(performance.staffing_rating),
            "rn_staffing_rating": float(performance.rn_staffing_rating),
            "total_weighted_health_survey_score": float(
                performance.total_weighted_health_survey_score
            ),
            "number_of_facility_reported_incidents": performance.number_of_facility_reported_incidents,
            "number_of_substantiated_complaints": performance.number_of_substantiated_complaints,
            "number_of_fines": performance.number_of_fines,
            "total_amount_of_fines_in_dollars": performance.total_amount_of_fines_in_dollars,
            "number_of_payment_denials": performance.number_of_payment_denials,
            "total_number_of_penalties": performance.total_number_of_penalties,
        }

        data.append(item)

    return jsonify(data)


@app.route("/")
def dashboard():
    return render_template("dashboard.html")


if __name__ == "__main__":
    app.run(debug=True)
