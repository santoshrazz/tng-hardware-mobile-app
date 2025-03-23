import { app } from "./app.js";
import dotenv from "dotenv";
import { connectToDb } from "./db/connect.db.js";
// import serverless from 'serverless-http'

dotenv.config({ path: "./.env" });

connectToDb()
    .then(() => {
        app.listen(process.env.PORT || 8080, () => {
            console.log("Server listening at port", process.env.PORT);
        });
    })
    .catch((error) => {
        console.log("Error starting the server", error);
    });
// export const handler = serverless(app)