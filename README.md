# I. Local development:

### Development:

#### 0. Install:

`npm run install:all`,

#### 1.1 Server:

`npm run serve --prefix ./server`

Server runs on `localhost:3000`.

#### 1.2 Client:

`npm run serve --prefix ./client`

Client runs on `localhost:8080`.

or:

#### 2. Run production build locally:

`npm run start:local`

Everything runs on `localhost:3000`.

# II. Heroku:

### Deploy:

1. Commit all changes to git,
2. `npm run heroku:deploy`

### Logs:

1. `heroku logs --tail`
