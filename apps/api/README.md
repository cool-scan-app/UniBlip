# API

## Architecture

The backend of UniBlip uses a layered architecture. It is divided into controllers, services and repositories. The controller handles the HTTP-requests and maps URLs to functions, calls the corresponding service and turns the result into a response. The service handles the business logic of the application. It calls and combines data from one or more repositories. The repository queries the database and passes the result up to the calling service.

To start the development server:
```bash
npm run dev
```

```text
open http://localhost:8000/api/v1
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
