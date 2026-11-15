# API

## Architecture

The backend of UniBlip uses a layered architecture. It is divided into controllers, services and repositories. The controller handles the HTTP-requests and maps URLs to functions, calls the corresponding service and turns the result into a response. The service handles the business logic of the application. It calls and combines data from one or more repositories. The repository queries the database and passes the result up to the calling service.

## Database
The server has a database connection to a postgresql database that has to be set up locally for development. 
The server uses [Prisma ORM](https://www.prisma.io/docs) for database connections and database migrations.

01. install `postgresql 18` on your machine.
02. run postgresql as the postgres user to create a new user
03. Create the user and the database with the sql commands (replace `myuser`, `mypassword` and `mydb` with the username, password and name of the database you want to create):
```sql
CREATE ROLE myuser WITH LOGIN PASSWORD "mypassword";
CREATE DATABASE mydb OWNER myuser;
```
04. create `.env` in the api folder.
05. add the following to the file and change `myuser`, `mypassword` and `mydb` to the user, password and database you created in step 3:
```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
```
06. Run the following command to create the tables in the database
```bash
npm run contract:emit       # Update contract.json and contract.d.ts
npx prisma db init          # Create tables in the database
npm run migrate:status      # Show migration status
```
The tables will now appear in the database and the last command will show the status and history of the migrations.
07. run the script `db_script.ts` to insert dummy users to the database.
```bash
npx tsx db_script.ts
```
The users spcecified in the script are visible in the database. If you start the server and make a GET request to `[localhost:8000/api/v1/team](http://localhost:8000/api/v1/team), the development team will be returned as a list of users.

### Database migrations
Not yet described but will follow soon!




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
| ```/health/live``` | GET | liveness probe |
| ```/health/ready``` | GET | readiness probe |


Application endpoints (preceeded by```/api/v1```):
| endpoint | method | description |
| :--------: | :------: | :----------- |
| ```/``` | GET | root of application |
| ```/team``` | GET | Dummy endpoint for showing dev team and roles |
