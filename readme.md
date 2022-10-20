# DevCamper API

> Backend API for DevCamper application, which is a bootstrap directory website

## Usage

Rename "config/config.env.env" to "config/config.env" and update the values/settings to your own.

## Install Dependencies

```
npm install
```

## Run App

```
# Run in DEV mode
npm run dev

# Run in PROD mode
npm start
```

## Other Setups

> > [Setup MongoDB URI](https://dev.to/dalalrohit/how-to-connect-to-mongodb-atlas-using-node-js-k9i)

> > [Setup Mapquest](https://www.wpleaflet.com/docs/how-to-create-a-mapquest-api-key)

> > [Setup Mailtrap](https://help.mailtrap.io/article/12-getting-started-guide)

## Database Seeder

To seed the database with users, bootcamps, courses and reviews with data from the "\_data" folder, run

```
# Destroy all data
node seeder -d

# Import all data
node seeder -i
```

## API details

The API is live at [https://devcamper-api-amit.herokuapp.com](https://devcamper-api-amit.herokuapp.com)

- Version: 1.0.0
- License: MIT
