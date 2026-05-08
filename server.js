require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// ===== MONGODB =====

mongoose.connect(
    process.env.MONGO_URI
)
.then(() => {
    console.log("MongoDB Connected ✅");
})
.catch((err) => {
    console.log(err);
});

// ===== SCHEMA =====

const EntrySchema = new mongoose.Schema({

    type:String,

    month:String,

    date:String,

    cows:Number,

    milkPrice:Number,

    salary:Number,

    monthlyExpense:Number,

    dailyMilk:Number,

    revenue:Number
});

const Entry =
    mongoose.model(
        "Entry",
        EntrySchema
    );

// ===== ADD =====

app.post("/add", async (req,res)=>{

    try{

        await Entry.create(req.body);

        res.send({
            success:true
        });

    }catch(err){

        console.log(err);

        res.status(500).send({
            success:false
        });
    }
});

// ===== DASHBOARD =====

app.get("/dashboard", async (req,res)=>{

    try{

        const data =
            await Entry.find().sort({_id:1});

        // MONTHLY SETTINGS
        const monthly =
            data.find(
                d => d.type === "monthly"
            );

        // DAILY MILK ENTRIES
        const milkEntries =
            data.filter(
                d => d.type === "milk"
            );

        let totalMilk = 0;
        let totalRevenue = 0;

        milkEntries.forEach(entry => {

            totalMilk +=
                Number(entry.dailyMilk || 0);

            totalRevenue +=
                Number(entry.revenue || 0);
        });

        const totalExpense =
            Number(
                monthly?.monthlyExpense || 0
            );

        const totalProfit =
            totalRevenue -
            totalExpense;

        res.send({

            totalExpense,

            totalRevenue,

            totalMilk,

            totalProfit,

            records:milkEntries
        });

    }catch(err){

        console.log(err);

        res.status(500).send({
            success:false
        });
    }
});

// ===== START =====

app.listen(3000,"0.0.0.0",()=>{

    console.log(
        "Server running on port 3000"
    );
});