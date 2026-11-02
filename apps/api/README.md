# API

## Architecture

The backend of UniBlip uses a layered architecture. It is divided into controllers, services and repositories. The controller handles the HTTP-requests and maps URLs to functions, calls the corresponding service and turns the result into a response. The service handles the business logic of the application. It calls and combines data from one or more repositories. The repository queries the database and passes the result up to the calling service.

## Database
The server has a database connection to a postgresql database that has to be set up locally for development. 

01. install `postgresql 18` on your machine.
02. run postgresql as the postgres user to create a new user
03. Create the user and the database with the sql commands (replace `myuser`, `mypassword` and `mydb` with the username, password and name of the database you want to create):
```sql
CREATE ROLE myuser WITH LOGIN PASSWORD "mypassword";
CREATE DATABASE mydb OWNER myuser;
```
04. create `.env.development.local` in the api folder.
05. add the following to the file and change `myuser`, `mypassword` and `mydb` to the user, password and database you created in step 3:
```env
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
```

The server uses [postgres.js](https://www.npmjs.com/package/postgres) for database connections and [drizzle ORM](https://orm.drizzle.team/) for database migrations.


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
