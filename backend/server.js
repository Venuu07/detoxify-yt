import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'


dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Detoxify backend running");
})


app.post("/evaluate",async (req, res)=>{

    console.log("Received request body:");
    console.log(req.body);

    const {titles, catogories} = req.body

    console.log("Titles:", titles);
    console.log("Categories:", catogories);

    const decisions = titles.map(title => {
        if(
            title.toLowerCase().includes("tutorial")
        ){
            return "keep"
        }

        return "block"
    })

    res.json({
        success:true,
        decisions
    })
})


app.listen(PORT ,() => {
    console.log(`Server is running on port ${PORT}`);
})