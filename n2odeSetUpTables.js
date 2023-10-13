const { Pool } = require('pg');
const fs = require('fs');
const fastcsv = require('fast-csv');

// Using the DATABASE_URL environment variable provided by Heroku Postgres
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// const pool = new Pool({
//     host: 'localhost',
//     port: 5433,
//     database: 'mytestdatabase',
//     user: 'postgres',
//     password: 'SE@3qqqeasrai'
// });


const createZipcodeTableQuery = `
CREATE TABLE IF NOT EXISTS zipcode_table (
    provider_state VARCHAR(2) NOT NULL,
    provider_zip_code VARCHAR(10) PRIMARY KEY NOT NULL
)`;


const createPerformanceTableQuery = `
CREATE TABLE IF NOT EXISTS performance_table (
    most_recent_health_inspection_more_than_2_years_ago VARCHAR(5) NOT NULL,
    overall_rating FLOAT,
    health_inspection_rating FLOAT,
    staffing_rating FLOAT,
    RN_staffing_rating FLOAT,
    total_weighted_health_survey_score NUMERIC(10,3),
    number_of_facility_reported_incidents INT NOT NULL,
    number_of_substantiated_complaints INT NOT NULL,
    number_of_fines INT NOT NULL,
    total_amount_of_fines_in_dollars VARCHAR NOT NULL,
    number_of_payment_denials INT NOT NULL,
    total_number_of_penalties INT NOT NULL,
    performance_id INT NOT NULL PRIMARY KEY
)`;


const createBusinessTableQuery = `
            CREATE TABLE IF NOT EXISTS business_table (                
                federal_provider_number VARCHAR PRIMARY KEY NOT NULL, 
                provider_name VARCHAR(225) NOT NULL,
                provider_city VARCHAR(50) NOT NULL,
                provider_zip_code VARCHAR NOT NULL,
                    FOREIGN KEY (provider_zip_code) REFERENCES zipcode_table(provider_zip_code),
                provider_county_name VARCHAR(50) NOT NULL,
                ownership_type VARCHAR(50) NOT NULL,
                number_of_certified_beds INT NOT NULL,
                number_of_residents_in_certified_beds INT NOT NULL,
                provider_type VARCHAR(50) NOT NULL,
                provider_resides_in_hospital VARCHAR(5) NOT NULL,
                automatic_sprinkler_systems_in_all_required_areas VARCHAR(10) NOT NULL,
                location VARCHAR(225) NOT NULL,
                processing_date DATE NOT NULL,
                latitude NUMERIC(10,6) NOT NULL,
                longitude NUMERIC(10,6) NOT NULL,
                adjusted_total_nurse_staffing_hours_per_resident_per_day NUMERIC(8,6),
                performance_id INT NOT NULL,
                    FOREIGN KEY (performance_id) REFERENCES performance_table(performance_id)
            )`;


function createTable(query) {
    return new Promise((resolve, reject) => {
        pool.query(query, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


async function processCSV() {
    try {
        // Create tables
        await createTable(createZipcodeTableQuery);
        console.log('Table created or already exists.');
        await createTable(createPerformanceTableQuery);
        console.log('Table created or already exists.');
        await createTable(createBusinessTableQuery);
        console.log('Table created or already exists.');

        // Process performance_table.csv
        await new Promise((resolve, reject) => {
            fs.createReadStream('./static/TableData/zipcode_table.csv')
                .pipe(fastcsv.parse({ headers: true }))
                .on('data', function (row) {
                    this.pause();

                    pool.query(
                        'INSERT INTO zipcode_table (provider_state, provider_zip_code) VALUES ($1, $2)',
                        [row['Provider State'], row['Provider Zip Code']],
                        (err) => {
                            if (err) {
                                reject(err);
                            }
                            this.resume();
                        }
                    );
                })
                .on('end', resolve)
                .on('error', reject);
        });


        // Process performance_table.csv
        await new Promise((resolve, reject) => {
            fs.createReadStream('./static/TableData/performance_table.csv')
                .pipe(fastcsv.parse({ headers: true }))
                .on('data', function (row) {
                    this.pause();

                    pool.query(
                        'INSERT INTO performance_table (most_recent_health_inspection_more_than_2_years_ago, \
                        overall_rating, health_inspection_rating, staffing_rating, RN_staffing_rating, \
                        total_weighted_health_survey_score, number_of_facility_reported_incidents, \
                        number_of_substantiated_complaints, number_of_fines, total_amount_of_fines_in_dollars, \
                        number_of_payment_denials, total_number_of_penalties, performance_id) VALUES ($1, $2, \
                            $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
                        [row['Most Recent Health Inspection More Than 2 Years Ago'], row['Overall Rating'] || null,
                        row['Health Inspection Rating'] || null, row['Staffing Rating'] || null, row['RN Staffing Rating'] || null,
                        row['Total Weighted Health Survey Score'] || null, row['Number of Facility Reported Incidents'],
                        row['Number of Substantiated Complaints'], row['Number of Fines'], row['Total Amount of Fines in Dollars'],
                        row['Number of Payment Denials'], row['Total Number of Penalties'], row['performance_id']],
                        (err) => {
                            if (err) {
                                reject(err);
                            }
                            this.resume();
                        }
                    );
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Process business_table.csv
        await new Promise((resolve, reject) => {
            fs.createReadStream('./static/TableData/business_table.csv')
                .pipe(fastcsv.parse({ headers: true }))
                .on('data', function (row) {
                    this.pause();

                    pool.query(
                        'INSERT INTO business_table (\
                            federal_provider_number,\
                            provider_name,\
                            provider_city,\
                            provider_zip_code,\
                            provider_county_name,\
                            ownership_type,\
                            number_of_certified_beds,\
                            number_of_residents_in_certified_beds,\
                            provider_type,\
                            provider_resides_in_hospital,\
                            automatic_sprinkler_systems_in_all_required_areas,\
                            location,\
                            processing_date,\
                            latitude,\
                            longitude,\
                            adjusted_total_nurse_staffing_hours_per_resident_per_day,\
                            performance_id)\
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,\
                                $14, $15, $16, $17)',


                        [row['Federal Provider Number'],
                        row['Provider Name'],
                        row['Provider City'],
                        row['Provider Zip Code'],
                        row['Provider County Name'],
                        row['Ownership Type'],
                        row['Number of Certified Beds'],
                        row['Number of Residents in Certified Beds'],
                        row['Provider Type'],
                        row['Provider Resides in Hospital'],
                        row['Automatic Sprinkler Systems in All Required Areas'],
                        row['Location'],
                        row['Processing Date'],
                        row['Latitude'],
                        row['Longitude'],
                        row['Adjusted Total Nurse Staffing Hours per Resident per Day'] || null,
                        row['performance_id']],
                        (err) => {
                            if (err) {
                                reject(err);
                            }
                            this.resume();
                        }
                    );
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log('CSV file processed and data inserted into the database.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end(() => {
            console.log('Pool has ended');
        });
    }
}

// Call the async function
processCSV();
