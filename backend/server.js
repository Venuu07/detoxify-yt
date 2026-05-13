import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());

app.use(express.json());

/* =========================================
   TEST ROUTE
========================================= */

app.get("/", (req, res) => {
    res.send("Detoxify backend running");
});

/* =========================================
   EVALUATE ROUTE
========================================= */

app.post("/evaluate", async (req, res) => {

    console.log("Received request body:");

    console.log(req.body);

    const { titles, categories } = req.body;

    console.log("Titles:", titles);

    console.log("Categories:", categories);

    // Dummy logic for now
    const decisions = titles.map(title => {

        if (
            title.toLowerCase().includes("tutorial")
        ) {
            return "keep";
        }

        return "block";
    });

    res.json({
        success: true,
        decisions
    });
});

/* =========================================
   START SERVER
========================================= */

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});