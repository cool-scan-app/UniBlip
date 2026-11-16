# API

## Architecture

The backend of UniBlip uses a layered architecture. It is divided into controllers, services and repositories. The controller handles the HTTP-requests and maps URLs to functions, calls the corresponding service and turns the result into a response. The service handles the business logic of the application. It calls and combines data from one or more repositories. The repository queries the database and passes the result up to the calling service.

## Database
The server has a database connection to a postgresql database that has to be set up locally for development. 
The server uses [Prisma ORM](https://www.prisma.io/docs) for database connections and database migrations. 
See [`ERD.md`](ERD.md) for the entity relationship diagram of the database. 

01. If you haven't run `npm install` in the root of the project yet, start with that.
02. install `postgresql 18` on your machine.
03. run postgresql as the postgres user to create a new user
04. Create the user and the database with the sql commands (replace `myuser`, `mypassword` and `mydb` with the username, password and name of the database you want to create):
```sql
CREATE ROLE myuser WITH LOGIN PASSWORD "mypassword";
CREATE DATABASE mydb OWNER myuser;
```
05. create `.env` in the api folder.
06. add the following to the file and change `myuser`, `mypassword` and `mydb` to the user, password and database you created in step 3:
```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
```
07. Run the following command to create the tables in the database
```bash
npm run contract:emit       # Update contract.json and contract.d.ts
npx prisma db init          # Create tables in the database
npm run migrate:status      # Show migration status
```
The tables will now appear in the database and the last command will show the status and history of the migrations.

08. run the script `db_script.ts` to insert dummy users to the database.
```bash
npx tsx db_script.ts
```
The users spcecified in the script are visible in the database. If you start the server and make a GET request to [`localhost:8000/api/v1/team`](http://localhost:8000/api/v1/team), the development team will be returned as a list of users. Or you can find individual team members with their id by making a GET request to `localhost:8000/api/v1/team/:id` where you replace `:id` with the id of the team member.

### Database migrations
To make changes to the database model, edit [`contract.prisma`](./src/prisma/contract.prisma) in `src/prisma/`. Regenerate `contract.d.ts` and `contract.json` with the command:
```bash
npm run contract:emit
```
Then plan a migration and name it with the command:
```bash
npm run migrate:plan <migration_name>
```
This command compares the new contract with the latest applied to the database and writes the difference to a folder named with the date, time and migration name in `migrations/app/`

To apply the migration to the database, run the command:
```bash
npm run migrate:apply
```
The command runs all the migrations that are not yet applied to the database. 

## Start the server

To start the development server (from api-folder):
```bash
npm run dev
```
or if you are in the root of the project:
```bash
npm run api-dev
```
then open
```text
http://localhost:8000/api/v1
```
Server endpoints:
| endpoint | method | description |
| :--------: | :------: | ----------- |
| `/health/live` | GET | liveness probe |
| `/health/ready` | GET | readiness probe |


Application endpoints (preceeded by`/api/v1`):
| endpoint | method | description |
| :--------: | :------: | :----------- |
| `/` | GET | root of application |
| `/team` | GET | Dummy endpoint for showing dev team |
| `/team/:id` | GET | Dummy endpoint for showing a individual dev team member by their id |