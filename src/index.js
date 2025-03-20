import { app } from './app.js'
import dotenv from 'dotenv'
import { connectToDb } from './db/connect.db.js'
dotenv.config({ path: "./.env" })

connectToDb().then(() => {
    app.listen(process.env.PORT || 8080, () => {
        console.log('server listening at port', process.env.PORT);
    })
}).catch((error) => {
    // console.log("error starting the server");
})