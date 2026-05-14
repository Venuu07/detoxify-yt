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


async function evaluateTitlesWithGemini(titles, categories) {
    const prompt=`
You are a strict productivity filter.

The user ONLY wants content related to:
${categories}

Evaluate these YouTube titles.

Return ONLY a valid JSON array.

Rules:
- "keep" → relevant/productive
- "block" → distracting/irrelevant

The array length MUST exactly match input length.

Input titles:
${JSON.stringify(titles)}
`;

const response =await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],

            generationConfig: {
                response_mime_type: "application/json"
            }
        })
    }
);

 if(!response.ok){

    const errorText = await response.text();

    throw new Error(
        `Gemini API Error ${response.status}:  ${errorText}`
    )
 }  

 const data = await response.json();

 const rawText =
    data.candidates[0].content.parts[0].text;

 console.log("Raw Gemini response")

 console.log(rawText);

 return JSON.parse(rawText);

}
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
    const decisions =
        await evaluateTitlesWithGemini(
            titles,
            categories
        );

    if(
        !Array.isArray(decisions) ||
        decisions.length !== titles.length
    ){
        throw new Error(
            "Gemini returned invalid response structure"
        )
    }

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